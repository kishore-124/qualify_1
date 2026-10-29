import prisma from '@/lib/prisma';
import { route, json, readBody, requireUser, ApiError } from '@/lib/api';
import { assertLectureAccess } from '@/lib/access';

// GET /api/lectures/:id/notes — my private notes for this lecture
export const GET = route(async (req, { id }) => {
  const user = await requireUser();
  await assertLectureAccess(id, user);
  const notes = await prisma.note.findMany({ where: { userId: user.id, lectureId: id }, orderBy: { timestamp: 'asc' } });
  return json({ notes });
});

// POST /api/lectures/:id/notes  { content, timestamp }
export const POST = route(async (req, { id }) => {
  const user = await requireUser();
  await assertLectureAccess(id, user);
  const { content, timestamp } = await readBody(req);
  if (!content?.trim()) throw new ApiError('Note cannot be empty', 422);
  const note = await prisma.note.create({
    data: { content: content.trim(), timestamp: Math.max(0, parseInt(timestamp) || 0), userId: user.id, lectureId: id },
  });
  return json({ note }, 201);
});
