import prisma from '@/lib/prisma';
import { route, json, readBody, requireUser, requireActiveInstructor, ApiError } from '@/lib/api';

// GET /api/coupons — admins see all coupons, instructors see coupons for their courses
export const GET = route(async () => {
  const user = await requireUser('INSTRUCTOR', 'ADMIN');
  const coupons = await prisma.coupon.findMany({
    where: user.role === 'ADMIN' ? {} : { course: { instructorId: user.id } },
    orderBy: { createdAt: 'desc' },
    include: { course: { select: { id: true, title: true } } },
  });
  return json({ coupons });
});

// POST /api/coupons  { code, discountPercent, maxUses?, expiresAt?, courseId? }
// Instructors must scope coupons to one of their own courses; admins can create site-wide coupons.
export const POST = route(async (req) => {
  const user = await requireActiveInstructor();
  const b = await readBody(req);
  const code = String(b.code || '').trim().toUpperCase().replace(/\s+/g, '');
  const pct = parseInt(b.discountPercent);
  if (!/^[A-Z0-9_-]{3,20}$/.test(code)) throw new ApiError('Code must be 3-20 letters/numbers', 422);
  if (!(pct >= 1 && pct <= 100)) throw new ApiError('Discount must be between 1 and 100%', 422);

  if (user.role !== 'ADMIN') {
    if (!b.courseId) throw new ApiError('Choose a course for this coupon', 422);
    const course = await prisma.course.findUnique({ where: { id: b.courseId } });
    if (!course || course.instructorId !== user.id) throw new ApiError('You can only create coupons for your own courses', 403);
  }

  const coupon = await prisma.coupon.create({
    data: {
      code,
      discountPercent: pct,
      maxUses: b.maxUses ? parseInt(b.maxUses) : null,
      expiresAt: b.expiresAt ? new Date(b.expiresAt) : null,
      courseId: b.courseId || null,
    },
    include: { course: { select: { id: true, title: true } } },
  });
  return json({ coupon }, 201);
});
