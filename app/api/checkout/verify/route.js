import prisma from '@/lib/prisma';
import { route, json, requireUser, ApiError } from '@/lib/api';
import { fulfillOrder } from '@/lib/payments';
import { getStripe } from '@/lib/stripe';

/**
 * GET /api/checkout/verify?session_id=cs_...   (after Stripe redirect)
 * GET /api/checkout/verify?order=...           (demo / free orders)
 *
 * Confirms payment with Stripe and fulfils the order if the webhook hasn't yet.
 */
export const GET = route(async (req) => {
  const user = await requireUser();
  const sp = new URL(req.url).searchParams;
  const sessionId = sp.get('session_id');
  let orderId = sp.get('order');

  if (sessionId) {
    const stripe = getStripe();
    if (!stripe) throw new ApiError('Stripe is not configured', 400);
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent'] });
    orderId = session.metadata?.orderId;
    if (!orderId) throw new ApiError('Order not found for this payment', 404);
    if (session.payment_status === 'paid') {
      const pi = session.payment_intent;
      await fulfillOrder(orderId, { paymentIntentId: pi?.id, chargeId: typeof pi?.latest_charge === 'string' ? pi.latest_charge : pi?.latest_charge?.id });
    }
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId || '' },
    include: { items: { include: { course: { select: { id: true, title: true, slug: true, thumbnail: true, instructor: { select: { name: true } } } } } } },
  });
  if (!order || order.userId !== user.id) throw new ApiError('Order not found', 404);
  return json({ order });
});
