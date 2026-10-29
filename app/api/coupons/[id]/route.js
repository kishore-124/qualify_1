import prisma from '@/lib/prisma';
import { route, json, readBody, requireUser, requireActiveInstructor, ApiError } from '@/lib/api';

async function loadOwned(id, user) {
  const coupon = await prisma.coupon.findUnique({ where: { id }, include: { course: true } });
  if (!coupon) throw new ApiError('Coupon not found', 404);
  if (user.role !== 'ADMIN' && coupon.course?.instructorId !== user.id) throw new ApiError('Forbidden', 403);
  return coupon;
}

// PATCH /api/coupons/:id  { active }
export const PATCH = route(async (req, { id }) => {
  const user = await requireActiveInstructor();
  await loadOwned(id, user);
  const { active } = await readBody(req);
  const coupon = await prisma.coupon.update({ where: { id }, data: { active: !!active } });
  return json({ coupon });
});

// DELETE /api/coupons/:id
export const DELETE = route(async (req, { id }) => {
  const user = await requireActiveInstructor();
  await loadOwned(id, user);
  await prisma.coupon.delete({ where: { id } });
  return json({ ok: true });
});
