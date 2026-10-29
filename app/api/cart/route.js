import prisma from '@/lib/prisma';
import { route, json, readBody, requireUser, ApiError } from '@/lib/api';
import { courseCardSelect, withStats } from '@/lib/queries';
import { cartSummary, recommendFor } from '@/lib/cart';

async function loadCart(userId) {
  const rows = await prisma.cartItem.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { course: { select: courseCardSelect } },
  });
  const courses = await withStats(rows.map((r) => r.course));
  const items = rows.map((r, i) => ({ id: r.id, courseId: r.courseId, savedForLater: r.savedForLater, course: courses[i] }));
  const active = items.filter((i) => !i.savedForLater);
  const owned = await prisma.enrollment.findMany({ where: { userId }, select: { courseId: true } });
  const recommendations = await recommendFor(active.map((i) => i.course), [...owned.map((o) => o.courseId), ...items.map((i) => i.courseId)]);
  return {
    items: active,
    saved: items.filter((i) => i.savedForLater),
    ...cartSummary(active.map((i) => i.course)),
    recommendations,
  };
}

// GET /api/cart — active items, saved-for-later, totals and recommendations
export const GET = route(async () => {
  const user = await requireUser();
  return json(await loadCart(user.id));
});

// POST /api/cart  { courseId } — add to cart (moves it out of "saved for later")
export const POST = route(async (req) => {
  const user = await requireUser();
  const { courseId } = await readBody(req);
  const course = await prisma.course.findUnique({ where: { id: courseId || '' }, include: { instructor: { select: { status: true } } } });
  if (!course || course.status !== 'PUBLISHED') throw new ApiError('Course not found', 404);
  if (course.instructor.status !== 'ACTIVE') throw new ApiError('This course isn’t available for purchase right now', 409);
  if (course.instructorId === user.id) throw new ApiError('You cannot buy your own course', 400);
  const enrolled = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId } } });
  if (enrolled) throw new ApiError('You already own this course', 409);

  await prisma.cartItem.upsert({
    where: { userId_courseId: { userId: user.id, courseId } },
    create: { userId: user.id, courseId },
    update: { savedForLater: false },
  });
  return json(await loadCart(user.id), 201);
});

// PATCH /api/cart  { courseId, savedForLater } — save for later / move back to cart
export const PATCH = route(async (req) => {
  const user = await requireUser();
  const { courseId, savedForLater } = await readBody(req);
  await prisma.cartItem.update({
    where: { userId_courseId: { userId: user.id, courseId } },
    data: { savedForLater: !!savedForLater },
  });
  return json(await loadCart(user.id));
});

// DELETE /api/cart?courseId=...  (omit courseId to empty the active cart)
export const DELETE = route(async (req) => {
  const user = await requireUser();
  const courseId = new URL(req.url).searchParams.get('courseId');
  await prisma.cartItem.deleteMany({ where: { userId: user.id, ...(courseId ? { courseId } : { savedForLater: false }) } });
  return json(await loadCart(user.id));
});
