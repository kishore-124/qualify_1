import prisma from '@/lib/prisma';
import { route, json, requireUser } from '@/lib/api';

// GET /api/admin/stats — platform overview
export const GET = route(async () => {
  await requireUser('ADMIN');
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5, 1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [roles, statuses, revenue, fees, enrollments, openReports, restricted, pending, recentOrders, monthlyOrders, recentUsers] = await Promise.all([
    prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
    prisma.course.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.order.aggregate({ where: { status: 'PAID' }, _sum: { total: true }, _count: { _all: true } }),
    prisma.orderItem.aggregate({ where: { order: { status: 'PAID' } }, _sum: { platformFee: true } }),
    prisma.enrollment.count(),
    prisma.report.count({ where: { status: 'OPEN' } }),
    prisma.user.count({ where: { status: { not: 'ACTIVE' } } }),
    prisma.course.findMany({
      where: { status: 'PENDING' },
      orderBy: { updatedAt: 'asc' },
      include: { instructor: { select: { name: true } }, category: { select: { name: true } } },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { user: { select: { name: true, email: true } }, _count: { select: { items: true } } },
    }),
    prisma.order.findMany({ where: { status: 'PAID', createdAt: { gte: sixMonthsAgo } }, select: { total: true, createdAt: true } }),
    prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, name: true, email: true, role: true, createdAt: true } }),
  ]);

  const months = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(sixMonthsAgo);
    d.setMonth(d.getMonth() + i);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString('en', { month: 'short' }), revenue: 0, orders: 0 });
  }
  for (const o of monthlyOrders) {
    const d = new Date(o.createdAt);
    const m = months.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`);
    if (m) {
      m.revenue += o.total;
      m.orders += 1;
    }
  }

  const count = (arr, k, v) => arr.find((x) => x[k] === v)?._count._all || 0;
  return json({
    totals: {
      users: roles.reduce((n, r) => n + r._count._all, 0),
      students: count(roles, 'role', 'STUDENT'),
      instructors: count(roles, 'role', 'INSTRUCTOR'),
      admins: count(roles, 'role', 'ADMIN'),
      courses: statuses.reduce((n, s) => n + s._count._all, 0),
      published: count(statuses, 'status', 'PUBLISHED'),
      pending: count(statuses, 'status', 'PENDING'),
      revenue: Math.round((revenue._sum.total || 0) * 100) / 100,
      platformFees: Math.round((fees._sum.platformFee || 0) * 100) / 100,
      orders: revenue._count._all,
      enrollments,
      openReports,
      restricted,
      suspendedCourses: count(statuses, 'status', 'SUSPENDED'),
    },
    monthly: months.map((m) => ({ ...m, revenue: Math.round(m.revenue * 100) / 100 })),
    pending,
    recentOrders,
    recentUsers,
  });
});
