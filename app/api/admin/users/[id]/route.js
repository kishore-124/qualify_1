import prisma from '@/lib/prisma';
import { route, json, readBody, requireUser, ApiError } from '@/lib/api';
import { moderateUser, USER_ACTIONS } from '@/lib/moderation';

// GET /api/admin/users/:id — profile, activity and risk signals
export const GET = route(async (req, { id }) => {
  await requireUser('ADMIN');
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, role: true, avatar: true, headline: true, bio: true, website: true, createdAt: true,
      status: true, statusReason: true, statusChangedAt: true, payoutsHeld: true, stripeAccountId: true, payoutsEnabled: true,
      _count: { select: { enrollments: true, reviews: true, questions: true, reportsFiled: true } },
    },
  });
  if (!user) throw new ApiError('User not found', 404);

  const courseIds = (await prisma.course.findMany({ where: { instructorId: id }, select: { id: true } })).map((c) => c.id);
  const reviewIds = (await prisma.review.findMany({ where: { userId: id }, select: { id: true } })).map((r) => r.id);
  const qIds = (await prisma.question.findMany({ where: { userId: id }, select: { id: true } })).map((q) => q.id);

  const [courses, sold, refunded, earnings, reportsAgainst, history, reviews, orders] = await Promise.all([
    prisma.course.findMany({
      where: { instructorId: id },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, slug: true, thumbnail: true, status: true, price: true, discountPrice: true, studentCount: true, avgRating: true, reviewCount: true, rejectReason: true, updatedAt: true },
    }),
    prisma.orderItem.aggregate({ where: { courseId: { in: courseIds }, order: { status: 'PAID' } }, _sum: { price: true, instructorEarning: true }, _count: { _all: true } }),
    prisma.orderItem.count({ where: { courseId: { in: courseIds }, order: { status: 'REFUNDED' } } }),
    prisma.orderItem.groupBy({ by: ['earningStatus'], where: { instructorId: id, order: { status: 'PAID' } }, _sum: { instructorEarning: true } }),
    prisma.report.findMany({
      where: {
        OR: [
          { targetType: 'USER', targetId: id },
          { targetType: 'COURSE', targetId: { in: courseIds } },
          { targetType: 'REVIEW', targetId: { in: reviewIds } },
          { targetType: 'QUESTION', targetId: { in: qIds } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { reporter: { select: { name: true } } },
    }),
    prisma.adminAction.findMany({ where: { targetType: 'USER', targetId: id }, orderBy: { createdAt: 'desc' }, include: { admin: { select: { name: true } } } }),
    prisma.review.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' }, take: 10, include: { course: { select: { title: true, id: true } } } }),
    prisma.order.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, paymentRef: true, total: true, status: true, createdAt: true } }),
  ]);

  const sales = sold._count._all;
  const rated = courses.filter((c) => c.reviewCount > 0);
  const avgRating = rated.length ? rated.reduce((n, c) => n + c.avgRating * c.reviewCount, 0) / rated.reduce((n, c) => n + c.reviewCount, 0) : null;
  const refundRate = sales + refunded ? refunded / (sales + refunded) : 0;
  const openReports = reportsAgainst.filter((r) => r.status === 'OPEN').length;
  const takedowns = courses.filter((c) => ['SUSPENDED', 'REJECTED'].includes(c.status)).length;

  // Simple, explainable risk signals for the reviewer
  const signals = [
    { label: 'Refund rate', value: `${Math.round(refundRate * 100)}%`, level: refundRate >= 0.2 ? 'high' : refundRate >= 0.1 ? 'medium' : 'ok', hint: 'Above 10% deserves a look; above 20% usually means the course isn’t what was promised.' },
    { label: 'Open reports', value: openReports, level: openReports >= 3 ? 'high' : openReports >= 1 ? 'medium' : 'ok', hint: 'Reports from students about this person or their content.' },
    { label: 'Average rating', value: avgRating ? avgRating.toFixed(1) : '—', level: avgRating && avgRating < 3 ? 'high' : avgRating && avgRating < 3.8 ? 'medium' : 'ok', hint: 'Across all of their rated courses.' },
    { label: 'Rejected / taken down', value: takedowns, level: takedowns >= 2 ? 'high' : takedowns === 1 ? 'medium' : 'ok', hint: 'Courses that failed review or were suspended.' },
  ];

  return json({
    user,
    courses,
    stats: {
      sales,
      gross: sold._sum.price || 0,
      earned: sold._sum.instructorEarning || 0,
      pending: earnings.find((e) => e.earningStatus === 'PENDING')?._sum.instructorEarning || 0,
      paidOut: earnings.find((e) => e.earningStatus === 'PAID')?._sum.instructorEarning || 0,
      refunded,
    },
    signals,
    reports: reportsAgainst,
    history,
    reviews,
    orders,
  });
});

// POST /api/admin/users/:id  { action: warn|suspend|ban|reactivate|hold-payouts|release-payouts|role, reason?, holdPayouts?, role? }
export const POST = route(async (req, { id }) => {
  const admin = await requireUser('ADMIN');
  const { action, reason, holdPayouts, role } = await readBody(req);
  if (!USER_ACTIONS.includes(action)) throw new ApiError('Unknown action', 422);
  const user = await moderateUser(admin, id, action, { reason, holdPayouts, role });
  return json({ user: { id: user.id, status: user.status, role: user.role, payoutsHeld: user.payoutsHeld } });
});
