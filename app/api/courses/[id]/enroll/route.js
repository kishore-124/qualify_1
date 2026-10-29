import prisma from '@/lib/prisma';
import { route, json, requireUser, ApiError } from '@/lib/api';
import { enrollUser } from '@/lib/course';
import { effectivePrice } from '@/lib/utils';

// POST /api/courses/:id/enroll — instant enrollment for free courses
export const POST = route(async (req, { id }) => {
  const user = await requireUser();
  const course = await prisma.course.findUnique({ where: { id }, include: { instructor: { select: { status: true } } } });
  if (!course || course.status !== 'PUBLISHED' || course.instructor.status !== 'ACTIVE') throw new ApiError('This course isn’t available right now', 404);
  if (effectivePrice(course) > 0) throw new ApiError('This is a paid course. Please purchase it through checkout.', 402);
  const enrollment = await enrollUser(user.id, id);
  return json({ enrollment, slug: course.slug }, 201);
});
