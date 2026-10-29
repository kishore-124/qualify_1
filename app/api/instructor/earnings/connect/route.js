import prisma from '@/lib/prisma';
import { route, json, requireUser, requireActiveInstructor, ApiError } from '@/lib/api';
import { getStripe, appUrl } from '@/lib/stripe';

// POST /api/instructor/earnings/connect — start (or resume) Stripe Express onboarding
export const POST = route(async (req) => {
  const me = await requireActiveInstructor();
  const stripe = getStripe();
  if (!stripe) throw new ApiError('Payouts need Stripe. Add STRIPE_SECRET_KEY to your environment.', 400);

  const user = await prisma.user.findUnique({ where: { id: me.id } });
  let accountId = user.stripeAccountId;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      email: user.email,
      capabilities: { transfers: { requested: true } },
      business_profile: { product_description: 'Online courses sold on Qualify', url: user.website || undefined },
      metadata: { userId: user.id },
    });
    accountId = account.id;
    await prisma.user.update({ where: { id: user.id }, data: { stripeAccountId: accountId } });
  }

  const base = appUrl(req);
  const link = await stripe.accountLinks.create({
    account: accountId,
    type: 'account_onboarding',
    refresh_url: `${base}/instructor/earnings?onboarding=retry`,
    return_url: `${base}/instructor/earnings?onboarding=done`,
  });
  return json({ url: link.url });
});
