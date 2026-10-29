import prisma from '@/lib/prisma';
import { route, json, readBody, requireUser, requireActiveInstructor, assertCourseOwner } from '@/lib/api';

async function loadOwned(id, user) {
  const lecture = await prisma.lecture.findUnique({ where: { id }, include: { section: { include: { course: true } } } });
  assertCourseOwner(lecture?.section?.course, user);
  return lecture;
}

// PUT /api/lectures/:id
export const PUT = route(async (req, { id }) => {
  const user = await requireActiveInstructor();
  await loadOwned(id, user);
  const b = await readBody(req);
  const data = {};
  for (const f of ['title', 'description', 'videoUrl', 'resourceUrl']) if (b[f] !== undefined) data[f] = b[f] || null;
  if (data.title === null) delete data.title;
  if (b.duration !== undefined) data.duration = Math.max(0, parseInt(b.duration) || 0);
  if (b.isPreview !== undefined) data.isPreview = !!b.isPreview;
  if (Number.isInteger(b.position)) data.position = b.position;
  if (b.sectionId) data.sectionId = b.sectionId;
  const lecture = await prisma.lecture.update({ where: { id }, data });
  return json({ lecture });
});

// DELETE /api/lectures/:id
export const DELETE = route(async (req, { id }) => {
  const user = await requireActiveInstructor();
  await loadOwned(id, user);
  await prisma.lecture.delete({ where: { id } });
  return json({ ok: true });
});
