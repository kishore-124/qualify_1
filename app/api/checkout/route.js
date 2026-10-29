import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { route, json, readBody, requireUser, ApiError } from '@/lib/api';
import { findValidCoupon, priceCart } from '@/lib/coupons';
import { fulfillOrder } from '@/lib/payments';
import { getStripe, stripeEnabled, stripeKeyProblem, stripeError, toMinor, splitRevenue, CURRENCY, appUrl } from '@/lib/stripe';

/**
 * POST /api/checkout  { couponCode? }
 *
 * 1. Prices the active cart (sale prices + coupon) and creates a PENDING order.
 *    Every line records Qualify's commission and the instructor's earning.
 * 2. With Stripe configured: creates a Stripe Checkout Session and returns { url } to redirect to.
 *    The order is fulfilled by the webhook (or the success page) once payment succeeds.
 * 3. Without Stripe keys (local demo) or for a $0 total: fulfils immediately.
 */
export const POST = route(async (req) => {
  const user = await requireUser();
  const { couponCode } = await readBody(req);

  const cart = await prisma.cartItem.findMany({
    where: { userId: user.id, savedForLater: false },
    include: { course: { include: { instructor: { select: { status: true } } } } },
  });
  if (!cart.length) throw new ApiError('Your cart is empty', 400);

  const owned = await prisma.enrollment.findMany({
    where: { userId: user.id, courseId: { in: cart.map((c) => c.courseId) } },
    select: { courseId: true },
  });
  const ownedIds = new Set(owned.map((e) => e.courseId));
  const courses = cart.map((c) => c.course).filter((c) => c.status === 'PUBLISHED' && c.instructor.status === 'ACTIVE' && !ownedIds.has(c.id));
  if (!courses.length) throw new ApiError('Nothing in your cart can be bought right now — you may already own these courses or they were taken down', 400);

  const coupon = couponCode ? await findValidCoupon(couponCode) : null;
  const pricing = priceCart(courses, coupon);

  // Catch configuration mistakes before creating an order the student can't pay for
  if (pricing.total > 0 && stripeEnabled()) {
    const problem = stripeKeyProblem();
    if (problem) throw new ApiError(`Payments are misconfigured: ${problem}`, 500);
    if (pricing.total < 0.5) throw new ApiError('Stripe can’t charge less than $0.50. Remove the coupon or add another course.', 400);
  }
  const byId = Object.fromEntries(courses.map((c) => [c.id, c]));

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      subtotal: pricing.subtotal,
      discount: pricing.discount,
      total: pricing.total,
      couponCode: coupon?.code || null,
      currency: CURRENCY,
      status: 'PENDING',
      paymentRef: `QF-${crypto.randomBytes(5).toString('hex').toUpperCase()}`,
      items: {
        create: pricing.items.map((i) => ({
          courseId: i.courseId,
          price: i.price,
          instructorId: byId[i.courseId].instructorId,
          ...splitRevenue(i.price),
        })),
      },
    },
  });

  // Free after discounts, or demo mode without Stripe keys
  if (pricing.total <= 0 || !stripeEnabled()) {
    await fulfillOrder(order.id);
    return json({ url: `/checkout/success?order=${order.id}`, orderId: order.id, mode: pricing.total <= 0 ? 'free' : 'demo' }, 201);
  }

  const stripe = getStripe();
  const base = appUrl(req);
  const lineItems = pricing.items
    .filter((i) => i.price > 0)
    .map((i) => {
      const c = byId[i.courseId];
      return {
        quantity: 1,
        price_data: {
          currency: CURRENCY,
          unit_amount: toMinor(i.price),
          product_data: {
            name: c.title,
            ...(c.subtitle ? { description: c.subtitle.slice(0, 250) } : {}),
            ...(c.thumbnail?.startsWith('https://') ? { images: [c.thumbnail] } : {}),
            metadata: { courseId: c.id },
          },
        },
      };
    });

  let session;
  try {
    session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    customer_email: user.email,
    client_reference_id: order.id,
    metadata: { orderId: order.id, userId: user.id },
    payment_intent_data: { transfer_group: order.id, metadata: { orderId: order.id } },
    success_url: `${base}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/cart?canceled=1`,
    });
  } catch (e) {
    // Don't leave an unpayable order behind
    await prisma.order.update({ where: { id: order.id }, data: { status: 'FAILED' } });
    throw stripeError(e, 'create a checkout session');
  }

  await prisma.order.update({ where: { id: order.id }, data: { stripeSessionId: session.id } });
  return json({ url: session.url, orderId: order.id, mode: 'stripe' }, 201);
});
