import prisma from '@/lib/prisma';
import { route, json, readBody, requireUser } from '@/lib/api';

// POST /api/cart/merge  { courseIds: [] } — moves a guest (browser) cart into the account after login
export const POST = route(async (req) => {
  const user = await requireUser();
  const { courseIds = [] } = await readBody(req);
  const ids = [...new Set(courseIds)].slice(0, 50);
  if (!ids.length) return json({ added: 0 });

  const [courses, owned] = await Promise.all([
    prisma.course.findMany({ where: { id: { in: ids }, status: 'PUBLISHED', instructorId: { not: user.id }, instructor: { status: 'ACTIVE' } }, select: { id: true } }),
    prisma.enrollment.findMany({ where: { userId: user.id, courseId: { in: ids } }, select: { courseId: true } }),
  ]);
  const ownedIds = new Set(owned.map((o) => o.courseId));
  const toAdd = courses.filter((c) => !ownedIds.has(c.id));
  await prisma.cartItem.createMany({
    data: toAdd.map((c) => ({ userId: user.id, courseId: c.id })),
    skipDuplicates: true,
  });
  return json({ added: toAdd.length });
});
