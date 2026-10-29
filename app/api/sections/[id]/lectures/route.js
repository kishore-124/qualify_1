import prisma from '@/lib/prisma';
import { route, json, readBody, requireUser, requireActiveInstructor, assertCourseOwner, ApiError } from '@/lib/api';

// POST /api/sections/:id/lectures  { title, videoUrl?, duration? (seconds), description?, isPreview?, resourceUrl? }
export const POST = route(async (req, { id }) => {
  const user = await requireActiveInstructor();
  const section = await prisma.section.findUnique({ where: { id }, include: { course: true } });
  assertCourseOwner(section?.course, user);
  const b = await readBody(req);
  if (!b.title?.trim()) throw new ApiError('Lecture title is required', 422);

  const last = await prisma.lecture.findFirst({ where: { sectionId: id }, orderBy: { position: 'desc' } });
  const lecture = await prisma.lecture.create({
    data: {
      title: b.title.trim(),
      description: b.description || null,
      videoUrl: b.videoUrl || null,
      resourceUrl: b.resourceUrl || null,
      duration: Math.max(0, parseInt(b.duration) || 0),
      isPreview: !!b.isPreview,
      position: (last?.position ?? -1) + 1,
      sectionId: id,
    },
  });
  return json({ lecture }, 201);
});
