import prisma from '@/lib/prisma';
import { route, json, requireUser } from '@/lib/api';
import { stripeEnabled, PLATFORM_FEE_PERCENT } from '@/lib/stripe';
import { syncAccount } from '@/lib/payments';

// GET /api/instructor/earnings — earnings ledger, balances and payout account status
export const GET = route(async () => {
  const me = await requireUser('INSTRUCTOR', 'ADMIN');
  const user = await prisma.user.findUnique({ where: { id: me.id }, select: { id: true, stripeAccountId: true, payoutsEnabled: true } });

  let account = { payoutsEnabled: user.payoutsEnabled, detailsSubmitted: false, requirements: [] };
  try {
    account = await syncAccount(user);
  } catch (e) {
    account.error = e.message;
  }

  const where = { instructorId: me.id, order: { status: { in: ['PAID', 'REFUNDED'] } } };
  const [groups, items, perCourse] = await Promise.all([
    prisma.orderItem.groupBy({ by: ['earningStatus'], where, _sum: { price: true, platformFee: true, instructorEarning: true }, _count: { _all: true } }),
    prisma.orderItem.findMany({
      where,
      orderBy: { order: { createdAt: 'desc' } },
      take: 60,
      include: {
        course: { select: { title: true, slug: true } },
        order: { select: { createdAt: true, paymentRef: true, status: true, couponCode: true, user: { select: { name: true } } } },
      },
    }),
    prisma.orderItem.groupBy({ by: ['courseId'], where: { ...where, earningStatus: { not: 'REVERSED' } }, _sum: { price: true, instructorEarning: true }, _count: { _all: true } }),
  ]);

  const sum = (status, field) => groups.find((g) => g.earningStatus === status)?._sum[field] || 0;
  const live = groups.filter((g) => g.earningStatus !== 'REVERSED');
  const courses = await prisma.course.findMany({ where: { id: { in: perCourse.map((p) => p.courseId) } }, select: { id: true, title: true, slug: true, thumbnail: true } });

  const r2 = (n) => Math.round((n || 0) * 100) / 100;
  return json({
    feePercent: PLATFORM_FEE_PERCENT,
    stripe: {
      enabled: stripeEnabled(),
      connected: !!user.stripeAccountId,
      ...account,
    },
    totals: {
      gross: r2(live.reduce((n, g) => n + (g._sum.price || 0), 0)),
      fees: r2(live.reduce((n, g) => n + (g._sum.platformFee || 0), 0)),
      earned: r2(live.reduce((n, g) => n + (g._sum.instructorEarning || 0), 0)),
      paidOut: r2(sum('PAID', 'instructorEarning')),
      pending: r2(sum('PENDING', 'instructorEarning')),
      reversed: r2(sum('REVERSED', 'instructorEarning')),
      sales: live.reduce((n, g) => n + g._count._all, 0),
    },
    courses: perCourse
      .map((p) => ({ ...courses.find((c) => c.id === p.courseId), sales: p._count._all, gross: p._sum.price || 0, earned: p._sum.instructorEarning || 0 }))
      .sort((a, b) => b.earned - a.earned),
    items,
  });
});
