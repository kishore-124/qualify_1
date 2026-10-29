import prisma from '@/lib/prisma';
import { getStripe } from '@/lib/stripe';
import { fulfillOrder, refundOrder, releasePendingEarnings } from '@/lib/payments';
import { notify } from '@/lib/course';

/**
 * POST /api/stripe/webhook
 *
 * Point a Stripe webhook endpoint here (Dashboard → Developers → Webhooks, or
 * `stripe listen --forward-to localhost:3000/api/stripe/webhook`). Listen to:
 *   checkout.session.completed, checkout.session.async_payment_succeeded,
 *   checkout.session.async_payment_failed, checkout.session.expired,
 *   charge.refunded, account.updated  (enable "Listen to events on Connected accounts" for the last one)
 */
export async function POST(req) {
  let stripe;
  try {
    stripe = getStripe();
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
  if (!stripe) return new Response('Stripe is not configured', { status: 400 });
  if (!process.env.STRIPE_WEBHOOK_SECRET) return new Response('STRIPE_WEBHOOK_SECRET is not set', { status: 500 });

  const body = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, req.headers.get('stripe-signature'), process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return new Response(`Webhook signature verification failed: ${e.message}`, { status: 400 });
  }

  try {
    const obj = event.data.object;
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        if (obj.payment_status !== 'paid') break;
        const orderId = obj.metadata?.orderId || obj.client_reference_id;
        let chargeId;
        if (obj.payment_intent) {
          const pi = await stripe.paymentIntents.retrieve(obj.payment_intent);
          chargeId = typeof pi.latest_charge === 'string' ? pi.latest_charge : pi.latest_charge?.id;
        }
        await fulfillOrder(orderId, { paymentIntentId: obj.payment_intent, chargeId });
        break;
      }
      case 'checkout.session.async_payment_failed':
      case 'checkout.session.expired': {
        const orderId = obj.metadata?.orderId || obj.client_reference_id;
        if (orderId) await prisma.order.updateMany({ where: { id: orderId, status: 'PENDING' }, data: { status: 'FAILED' } });
        break;
      }
      case 'charge.refunded': {
        const order = await prisma.order.findFirst({ where: { OR: [{ stripeChargeId: obj.id }, { stripePaymentIntentId: obj.payment_intent }] } });
        if (order && obj.refunded) await refundOrder(order.id, { alreadyRefunded: true });
        break;
      }
      case 'account.updated': {
        const user = await prisma.user.findUnique({ where: { stripeAccountId: obj.id } });
        if (!user) break;
        const enabled = obj.capabilities?.transfers === 'active' && !!obj.details_submitted;
        if (enabled !== user.payoutsEnabled) {
          await prisma.user.update({ where: { id: user.id }, data: { payoutsEnabled: enabled } });
          if (enabled) {
            await notify(user.id, 'Payouts are active', 'Your earnings will now be sent to your Stripe account automatically.', '/instructor/earnings');
            await releasePendingEarnings(user.id);
          }
        }
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error('[stripe webhook]', event.type, e);
    return new Response('Webhook handler error', { status: 500 }); // Stripe will retry
  }

  return Response.json({ received: true });
}
