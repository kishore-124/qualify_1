import prisma from './prisma';
import { courseCardSelect, withStats } from './queries';
import { effectivePrice } from './utils';

/** Totals for a list of courses: list price, sale savings and what the student pays. */
export function cartSummary(courses) {
  const listTotal = courses.reduce((n, c) => n + (c.price || 0), 0);
  const subtotal = courses.reduce((n, c) => n + effectivePrice(c), 0);
  return { listTotal, subtotal, saleSavings: listTotal - subtotal, total: subtotal, count: courses.length };
}

/** Popular courses from the same categories as the cart, excluding anything already owned or in the cart. */
export async function recommendFor(courses, excludeIds = []) {
  const categoryIds = [...new Set(courses.map((c) => c.category?.id).filter(Boolean))];
  const rows = await prisma.course.findMany({
    where: {
      status: 'PUBLISHED',
      instructor: { status: 'ACTIVE' },
      id: { notIn: excludeIds },
      ...(categoryIds.length ? { categoryId: { in: categoryIds } } : {}),
    },
    orderBy: [{ studentCount: 'desc' }, { avgRating: 'desc' }],
    take: 4,
    select: courseCardSelect,
  });
  return withStats(rows);
}
