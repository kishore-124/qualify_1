import prisma from '@/lib/prisma';
import { route, json, requireUser, requireActiveInstructor, ApiError } from '@/lib/api';
import { releasePendingEarnings, syncAccount } from '@/lib/payments';

// POST /api/instructor/earnings/withdraw — send all pending earnings to my Stripe account now
export const POST = route(async () => {
  const me = await requireActiveInstructor();
  const user = await prisma.user.findUnique({ where: { id: me.id }, select: { id: true, stripeAccountId: true, payoutsEnabled: true } });
  const { payoutsEnabled } = await syncAccount(user);
  if (!payoutsEnabled) throw new ApiError('Finish Stripe onboarding to withdraw your earnings', 400);
  const result = await releasePendingEarnings(me.id);
  return json(result);
});
