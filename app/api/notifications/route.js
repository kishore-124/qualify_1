import prisma from '@/lib/prisma';
import { route, json, readBody, requireUser } from '@/lib/api';

// GET /api/notifications — latest 20
export const GET = route(async () => {
  const user = await requireUser();
  const [notifications, unread] = await Promise.all([
    prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 20 }),
    prisma.notification.count({ where: { userId: user.id, read: false } }),
  ]);
  return json({ notifications, unread });
});

// PATCH /api/notifications  { id? } — mark one (or all) as read
export const PATCH = route(async (req) => {
  const user = await requireUser();
  const { id } = await readBody(req);
  await prisma.notification.updateMany({ where: { userId: user.id, ...(id ? { id } : {}) }, data: { read: true } });
  return json({ ok: true });
});
