import prisma from '@/lib/prisma';
import { route, json, readBody, requireUser, ApiError } from '@/lib/api';
import { releasePendingEarnings, markEarningsPaidManually } from '@/lib/payments';
import { stripeEnabled, PLATFORM_FEE_PERCENT } from '@/lib/stripe';

// GET /api/admin/payouts — platform revenue split + what each instructor is owed
export const GET = route(async () => {
  await requireUser('ADMIN');
  const live = { order: { status: 'PAID' } };
  const [totals, byStatus, pendingByInstructor, recentOrders] = await Promise.all([
    prisma.orderItem.aggregate({ where: live, _sum: { price: true, platformFee: true, instructorEarning: true } }),
    prisma.orderItem.groupBy({ by: ['earningStatus'], where: live, _sum: { instructorEarning: true } }),
    prisma.orderItem.groupBy({ by: ['instructorId'], where: { ...live, earningStatus: 'PENDING' }, _sum: { instructorEarning: true }, _count: { _all: true } }),
    prisma.order.findMany({
      where: { status: { in: ['PAID', 'REFUNDED'] } },
      orderBy: { createdAt: 'desc' },
      take: 25,
      include: { user: { select: { name: true, email: true } }, items: { include: { course: { select: { title: true } } } } },
    }),
  ]);
  const instructors = await prisma.user.findMany({
    where: { id: { in: pendingByInstructor.map((p) => p.instructorId).filter(Boolean) } },
    select: { id: true, name: true, email: true, avatar: true, stripeAccountId: true, payoutsEnabled: true },
  });

  const r2 = (n) => Math.round((n || 0) * 100) / 100;
  return json({
    feePercent: PLATFORM_FEE_PERCENT,
    stripeEnabled: stripeEnabled(),
    totals: {
      gross: r2(totals._sum.price),
      platformFees: r2(totals._sum.platformFee),
      instructorEarnings: r2(totals._sum.instructorEarning),
      paidOut: r2(byStatus.find((s) => s.earningStatus === 'PAID')?._sum.instructorEarning),
      pending: r2(byStatus.find((s) => s.earningStatus === 'PENDING')?._sum.instructorEarning),
    },
    owed: pendingByInstructor
      .filter((p) => p.instructorId)
      .map((p) => ({ instructor: instructors.find((i) => i.id === p.instructorId), amount: r2(p._sum.instructorEarning), sales: p._count._all }))
      .sort((a, b) => b.amount - a.amount),
    recentOrders,
  });
});

// POST /api/admin/payouts  { action: 'release' | 'mark-paid', instructorId? }
export const POST = route(async (req) => {
  await requireUser('ADMIN');
  const { action, instructorId } = await readBody(req);
  if (action === 'release') return json(await releasePendingEarnings(instructorId));
  if (action === 'mark-paid') {
    if (!instructorId) throw new ApiError('instructorId is required', 422);
    return json({ marked: await markEarningsPaidManually(instructorId) });
  }
  throw new ApiError('Unknown action', 422);
});
