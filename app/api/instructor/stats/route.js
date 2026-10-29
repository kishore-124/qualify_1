import prisma from '@/lib/prisma';
import { route, json, requireUser } from '@/lib/api';

// GET /api/instructor/stats — dashboard analytics for the logged-in instructor
export const GET = route(async () => {
  const user = await requireUser('INSTRUCTOR', 'ADMIN');
  const courseWhere = { instructorId: user.id };

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5, 1);
  sixMonthsAgo.setHours(0, 0, 0, 0);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

  const [courses, revenueAgg, recentItems, newStudents, recentReviews, openQuestions] = await Promise.all([
    prisma.course.findMany({
      where: courseWhere,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true, title: true, slug: true, thumbnail: true, status: true, price: true, discountPrice: true,
        avgRating: true, reviewCount: true, studentCount: true, rejectReason: true, updatedAt: true,
        _count: { select: { sections: true } },
      },
    }),
    prisma.orderItem.aggregate({ where: { course: courseWhere, order: { status: 'PAID' } }, _sum: { price: true, instructorEarning: true }, _count: { _all: true } }),
    prisma.orderItem.findMany({
      where: { course: courseWhere, order: { status: 'PAID', createdAt: { gte: sixMonthsAgo } } },
      select: { instructorEarning: true, courseId: true, order: { select: { createdAt: true } } },
    }),
    prisma.enrollment.count({ where: { course: courseWhere, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.review.findMany({
      where: { course: courseWhere },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { user: { select: { name: true, avatar: true } }, course: { select: { title: true, slug: true } } },
    }),
    prisma.question.findMany({
      where: { course: courseWhere, answers: { none: { isInstructor: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { user: { select: { name: true } }, course: { select: { title: true, slug: true } } },
    }),
  ]);

  // Monthly revenue & sales for the last 6 months
  const months = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(sixMonthsAgo);
    d.setMonth(d.getMonth() + i);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString('en', { month: 'short' }), revenue: 0, sales: 0 });
  }
  const revenueByCourse = {};
  for (const item of recentItems) {
    const d = new Date(item.order.createdAt);
    const m = months.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`);
    if (m) {
      m.revenue += item.instructorEarning;
      m.sales += 1;
    }
  }
  const allItems = await prisma.orderItem.groupBy({
    by: ['courseId'],
    where: { course: courseWhere, order: { status: 'PAID' } },
    _sum: { instructorEarning: true },
  });
  for (const g of allItems) revenueByCourse[g.courseId] = g._sum.instructorEarning || 0;

  const totalStudents = courses.reduce((n, c) => n + c.studentCount, 0);
  const rated = courses.filter((c) => c.reviewCount > 0);
  const avgRating = rated.length ? rated.reduce((n, c) => n + c.avgRating * c.reviewCount, 0) / rated.reduce((n, c) => n + c.reviewCount, 0) : 0;

  return json({
    totals: {
      revenue: Math.round((revenueAgg._sum.instructorEarning || 0) * 100) / 100,
      gross: Math.round((revenueAgg._sum.price || 0) * 100) / 100,
      sales: revenueAgg._count._all,
      students: totalStudents,
      newStudents,
      courses: courses.length,
      published: courses.filter((c) => c.status === 'PUBLISHED').length,
      avgRating: Math.round(avgRating * 10) / 10,
      reviews: courses.reduce((n, c) => n + c.reviewCount, 0),
    },
    monthly: months.map((m) => ({ ...m, revenue: Math.round(m.revenue * 100) / 100 })),
    courses: courses.map((c) => ({ ...c, revenue: revenueByCourse[c.id] || 0 })),
    recentReviews,
    openQuestions,
  });
});
