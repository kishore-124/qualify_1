import prisma from '@/lib/prisma';
import { route, json, requireUser, ApiError } from '@/lib/api';
import { getStripe } from '@/lib/stripe';

// POST /api/instructor/earnings/dashboard — one-time login link to the Stripe Express dashboard
export const POST = route(async () => {
  const me = await requireUser('INSTRUCTOR', 'ADMIN');
  const stripe = getStripe();
  const user = await prisma.user.findUnique({ where: { id: me.id }, select: { stripeAccountId: true } });
  if (!stripe || !user.stripeAccountId) throw new ApiError('Connect a Stripe account first', 400);
  const link = await stripe.accounts.createLoginLink(user.stripeAccountId);
  return json({ url: link.url });
});
