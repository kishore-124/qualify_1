import prisma from '@/lib/prisma';
import { route, json, readBody, requireUser, requireActiveInstructor, assertCourseOwner, ApiError } from '@/lib/api';
import { notify } from '@/lib/course';

// POST /api/courses/:id/publish  { action: 'submit' | 'unpublish' }
// Instructors submit for review (PENDING); admins publish directly.
export const POST = route(async (req, { id }) => {
  const user = await requireActiveInstructor();
  const { action = 'submit' } = await readBody(req);
  const course = await prisma.course.findUnique({
    where: { id },
    include: { sections: { include: { _count: { select: { lectures: true } } } } },
  });
  assertCourseOwner(course, user);
  if (course.status === 'SUSPENDED' && user.role !== 'ADMIN') {
    throw new ApiError(`This course was taken down by Qualify${course.rejectReason ? `: ${course.rejectReason}` : ''}. Contact support to have it reviewed.`, 403);
  }

  if (action === 'unpublish') {
    const updated = await prisma.course.update({ where: { id }, data: { status: 'DRAFT' } });
    return json({ course: updated });
  }

  const problems = [];
  if (!course.description || course.description.length < 50) problems.push('Description of at least 50 characters');
  if (!course.thumbnail) problems.push('Course thumbnail image');
  if (!course.categoryId) problems.push('Category');
  const lectures = course.sections.reduce((n, s) => n + s._count.lectures, 0);
  if (lectures < 1) problems.push('At least one lecture');
  if (course.outcomes.length < 1) problems.push('At least one learning outcome');
  if (problems.length) throw new ApiError(`Missing: ${problems.join(', ')}`, 422);

  const status = user.role === 'ADMIN' ? 'PUBLISHED' : 'PENDING';
  const updated = await prisma.course.update({ where: { id }, data: { status, rejectReason: null } });

  if (status === 'PENDING') {
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
    await Promise.all(admins.map((a) => notify(a.id, 'Course awaiting review', `"${course.title}" was submitted for review.`, '/admin?tab=courses')));
  }
  return json({ course: updated });
});
