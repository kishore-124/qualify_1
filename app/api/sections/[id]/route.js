import prisma from '@/lib/prisma';
import { route, json, readBody, requireUser, requireActiveInstructor, assertCourseOwner } from '@/lib/api';

async function loadOwned(id, user) {
  const section = await prisma.section.findUnique({ where: { id }, include: { course: true } });
  assertCourseOwner(section?.course, user);
  return section;
}

// PUT /api/sections/:id  { title?, position? }
export const PUT = route(async (req, { id }) => {
  const user = await requireActiveInstructor();
  await loadOwned(id, user);
  const { title, position } = await readBody(req);
  const data = {};
  if (title?.trim()) data.title = title.trim();
  if (Number.isInteger(position)) data.position = position;
  const section = await prisma.section.update({ where: { id }, data });
  return json({ section });
});

// DELETE /api/sections/:id
export const DELETE = route(async (req, { id }) => {
  const user = await requireActiveInstructor();
  await loadOwned(id, user);
  await prisma.section.delete({ where: { id } });
  return json({ ok: true });
});
