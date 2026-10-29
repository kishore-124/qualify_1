import prisma from './prisma';
import { getStripe, toMinor } from './stripe';
import { enrollUser, notify } from './course';
import { formatMoney } from './utils';

/**
 * Marks an order as paid, enrolls the student, records instructor earnings
 * and pays out instructors that have finished Stripe onboarding.
 * Safe to call more than once (webhook + success page both call it).
 */
export async function fulfillOrder(orderId, { paymentIntentId, chargeId } = {}) {
  const flipped = await prisma.order.updateMany({
    where: { id: orderId, status: 'PENDING' },
    data: {
      status: 'PAID',
      paidAt: new Date(),
      ...(paymentIntentId ? { stripePaymentIntentId: paymentIntentId } : {}),
      ...(chargeId ? { stripeChargeId: chargeId } : {}),
    },
  });

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { course: { select: { id: true, title: true, slug: true } } } } },
  });
  if (!order || flipped.count === 0) return order; // unknown, or already fulfilled

  for (const item of order.items) await enrollUser(order.userId, item.courseId);

  if (order.couponCode) {
    await prisma.coupon.updateMany({ where: { code: order.couponCode }, data: { usedCount: { increment: 1 } } });
  }
  await prisma.cartItem.deleteMany({ where: { userId: order.userId, courseId: { in: order.items.map((i) => i.courseId) } } });
  await notify(order.userId, 'Payment received', `Order ${order.paymentRef} — ${formatMoney(order.total)} paid. Happy learning!`, '/dashboard?tab=purchases');

  for (const item of order.items) {
    if (item.instructorId && item.instructorEarning > 0) {
      await notify(item.instructorId, `You earned ${formatMoney(item.instructorEarning)}`, `New sale of "${item.course.title}".`, '/instructor/earnings');
    }
  }

  try {
    await payoutOrder(order.id);
  } catch (e) {
    console.error('[payout] order', order.id, e.message);
  }
  return order;
}

/** Sends one instructor earning to their connected Stripe account. */
async function transferItem(item) {
  const stripe = getStripe();
  if (!stripe || !item.instructor?.stripeAccountId || !item.instructor.payoutsEnabled) return false;
  if (item.instructor.payoutsHeld || item.instructor.status !== 'ACTIVE') return false; // on hold by moderation
  if (item.instructorEarning <= 0) return false;

  const transfer = await stripe.transfers.create(
    {
      amount: toMinor(item.instructorEarning, item.order.currency),
      currency: item.order.currency,
      destination: item.instructor.stripeAccountId,
      transfer_group: item.orderId,
      ...(item.order.stripeChargeId ? { source_transaction: item.order.stripeChargeId } : {}),
      metadata: { orderItemId: item.id, courseId: item.courseId, orderId: item.orderId },
    },
    { idempotencyKey: `qualify_transfer_${item.id}` }
  );
  await prisma.orderItem.update({
    where: { id: item.id },
    data: { earningStatus: 'PAID', stripeTransferId: transfer.id, paidOutAt: new Date() },
  });
  return true;
}

const payableInclude = {
  instructor: { select: { id: true, stripeAccountId: true, payoutsEnabled: true, payoutsHeld: true, status: true } },
  order: { select: { currency: true, stripeChargeId: true } },
};

export async function payoutOrder(orderId) {
  const items = await prisma.orderItem.findMany({
    where: { orderId, earningStatus: 'PENDING', order: { status: 'PAID' } },
    include: payableInclude,
  });
  for (const item of items) await transferItem(item);
}

/** Pays every pending earning (optionally for one instructor). Returns counts. */
export async function releasePendingEarnings(instructorId) {
  const items = await prisma.orderItem.findMany({
    where: {
      earningStatus: 'PENDING',
      order: { status: 'PAID' },
      instructor: { payoutsEnabled: true, stripeAccountId: { not: null }, payoutsHeld: false, status: 'ACTIVE' },
      ...(instructorId ? { instructorId } : {}),
    },
    include: payableInclude,
  });
  let paid = 0;
  const errors = [];
  for (const item of items) {
    try {
      if (await transferItem(item)) paid += 1;
    } catch (e) {
      errors.push(e.message);
    }
  }
  return { paid, failed: errors.length, errors: errors.slice(0, 3) };
}

/** Records payouts made outside Stripe (bank transfer, PayPal, Wise…). */
export async function markEarningsPaidManually(instructorId) {
  const res = await prisma.orderItem.updateMany({
    where: { instructorId, earningStatus: 'PENDING', order: { status: 'PAID' } },
    data: { earningStatus: 'PAID', paidOutAt: new Date(), stripeTransferId: 'manual' },
  });
  if (res.count) await notify(instructorId, 'Payout sent', `${res.count} earning(s) were paid out to you.`, '/instructor/earnings');
  return res.count;
}

/**
 * Refunds an order: refunds the student in Stripe, pulls back any instructor
 * transfers, removes access and marks earnings as reversed.
 * Pass { alreadyRefunded: true } when Stripe already refunded it (charge.refunded webhook).
 */
export async function refundOrder(orderId, { alreadyRefunded = false } = {}) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order || order.status !== 'PAID') return order;
  const stripe = getStripe();

  if (stripe && order.stripePaymentIntentId && !alreadyRefunded) {
    await stripe.refunds.create({ payment_intent: order.stripePaymentIntentId }, { idempotencyKey: `qualify_refund_${order.id}` });
  }
  for (const item of order.items) {
    if (stripe && item.stripeTransferId && item.stripeTransferId.startsWith('tr_')) {
      try {
        await stripe.transfers.createReversal(item.stripeTransferId, {}, { idempotencyKey: `qualify_reversal_${item.id}` });
      } catch (e) {
        console.error('[refund] transfer reversal failed', item.stripeTransferId, e.message);
      }
    }
  }

  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { status: 'REFUNDED', refundedAt: new Date() } }),
    prisma.orderItem.updateMany({ where: { orderId }, data: { earningStatus: 'REVERSED' } }),
    prisma.enrollment.deleteMany({ where: { userId: order.userId, courseId: { in: order.items.map((i) => i.courseId) } } }),
    ...order.items.map((i) => prisma.course.update({ where: { id: i.courseId }, data: { studentCount: { decrement: 1 } } })),
  ]);
  await notify(order.userId, 'Refund processed', `Order ${order.paymentRef} was refunded (${formatMoney(order.total)}).`, '/dashboard?tab=purchases');
  return prisma.order.findUnique({ where: { id: orderId } });
}

/** Pulls the latest Connect status from Stripe and stores it. */
export async function syncAccount(user) {
  const stripe = getStripe();
  if (!stripe || !user.stripeAccountId) return { payoutsEnabled: user.payoutsEnabled, detailsSubmitted: false };
  const acct = await stripe.accounts.retrieve(user.stripeAccountId);
  const payoutsEnabled = acct.capabilities?.transfers === 'active' && !!acct.details_submitted;
  if (payoutsEnabled !== user.payoutsEnabled) {
    await prisma.user.update({ where: { id: user.id }, data: { payoutsEnabled } });
  }
  return { payoutsEnabled, detailsSubmitted: !!acct.details_submitted, requirements: acct.requirements?.currently_due || [] };
}
