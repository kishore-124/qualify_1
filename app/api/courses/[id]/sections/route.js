import prisma from '@/lib/prisma';
import { route, json, readBody, requireUser, requireActiveInstructor, assertCourseOwner, ApiError } from '@/lib/api';

// POST /api/courses/:id/sections  { title }
export const POST = route(async (req, { id }) => {
  const user = await requireActiveInstructor();
  const course = await prisma.course.findUnique({ where: { id } });
  assertCourseOwner(course, user);
  const { title } = await readBody(req);
  if (!title?.trim()) throw new ApiError('Section title is required', 422);

  const last = await prisma.section.findFirst({ where: { courseId: id }, orderBy: { position: 'desc' } });
  const section = await prisma.section.create({
    data: { title: title.trim(), courseId: id, position: (last?.position ?? -1) + 1 },
    include: { lectures: true },
  });
  return json({ section }, 201);
});
