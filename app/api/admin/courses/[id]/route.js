import prisma from '@/lib/prisma';
import { route, json, readBody, requireUser, ApiError } from '@/lib/api';
import { moderateCourse, COURSE_ACTIONS } from '@/lib/moderation';

// GET /api/admin/courses/:id — everything needed to review a course before approving it
export const GET = route(async (req, { id }) => {
  await requireUser('ADMIN');
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      category: true,
      instructor: {
        select: {
          id: true, name: true, email: true, avatar: true, headline: true, status: true, statusReason: true, payoutsHeld: true, createdAt: true,
          _count: { select: { courses: true } },
        },
      },
      sections: { orderBy: { position: 'asc' }, include: { lectures: { orderBy: { position: 'asc' } } } },
      coupons: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!course) throw new ApiError('Course not found', 404);

  const [reviews, sales, refunds, reports, history, questions] = await Promise.all([
    prisma.review.findMany({ where: { courseId: id }, orderBy: { createdAt: 'desc' }, take: 50, include: { user: { select: { id: true, name: true, avatar: true } } } }),
    prisma.orderItem.aggregate({ where: { courseId: id, order: { status: 'PAID' } }, _sum: { price: true, platformFee: true }, _count: { _all: true } }),
    prisma.orderItem.count({ where: { courseId: id, order: { status: 'REFUNDED' } } }),
    prisma.report.findMany({
      where: { OR: [{ targetType: 'COURSE', targetId: id }, { targetType: 'REVIEW', targetId: { in: (await prisma.review.findMany({ where: { courseId: id }, select: { id: true } })).map((r) => r.id) } }] },
      orderBy: { createdAt: 'desc' },
      include: { reporter: { select: { name: true } } },
    }),
    prisma.adminAction.findMany({ where: { targetType: 'COURSE', targetId: id }, orderBy: { createdAt: 'desc' }, include: { admin: { select: { name: true } } } }),
    prisma.question.findMany({ where: { courseId: id }, orderBy: { createdAt: 'desc' }, take: 20, include: { user: { select: { name: true } }, _count: { select: { answers: true } } } }),
  ]);

  // Automatic quality checks shown to the reviewer
  const lectures = course.sections.flatMap((s) => s.lectures);
  const duration = lectures.reduce((n, l) => n + l.duration, 0);
  const checks = [
    ['Description is at least 200 characters', (course.description || '').length >= 200],
    ['Has a thumbnail', !!course.thumbnail],
    ['Has a promo video', !!course.previewVideo],
    ['At least 5 lectures', lectures.length >= 5],
    ['At least 30 minutes of video', duration >= 1800],
    ['Every lecture has a video', lectures.length > 0 && lectures.every((l) => l.videoUrl)],
    ['At least one free preview lecture', lectures.some((l) => l.isPreview)],
    ['Lists 4+ learning outcomes', course.outcomes.length >= 4],
    ['Price is set sensibly', course.price === 0 || course.price >= 4.99],
  ].map(([label, ok]) => ({ label, ok }));

  return json({
    course,
    stats: {
      lectures: lectures.length,
      duration,
      sales: sales._count._all,
      gross: sales._sum.price || 0,
      fees: sales._sum.platformFee || 0,
      refunds,
      refundRate: sales._count._all + refunds ? refunds / (sales._count._all + refunds) : 0,
    },
    checks,
    reviews,
    reports,
    history,
    questions,
  });
});

// POST /api/admin/courses/:id  { action: approve|reject|suspend|restore|unpublish|feature|unfeature, reason? }
export const POST = route(async (req, { id }) => {
  const admin = await requireUser('ADMIN');
  const { action, reason } = await readBody(req);
  if (!COURSE_ACTIONS.includes(action)) throw new ApiError('Unknown action', 422);
  const course = await moderateCourse(admin, id, action, reason);
  return json({ course });
});
