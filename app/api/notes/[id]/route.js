import prisma from '@/lib/prisma';
import { route, json, readBody, requireUser, ApiError } from '@/lib/api';

async function own(id, user) {
  const note = await prisma.note.findUnique({ where: { id } });
  if (!note || note.userId !== user.id) throw new ApiError('Note not found', 404);
  return note;
}

// PUT /api/notes/:id  { content }
export const PUT = route(async (req, { id }) => {
  const user = await requireUser();
  await own(id, user);
  const { content } = await readBody(req);
  if (!content?.trim()) throw new ApiError('Note cannot be empty', 422);
  const note = await prisma.note.update({ where: { id }, data: { content: content.trim() } });
  return json({ note });
});

// DELETE /api/notes/:id
export const DELETE = route(async (req, { id }) => {
  const user = await requireUser();
  await own(id, user);
  await prisma.note.delete({ where: { id } });
  return json({ ok: true });
});
