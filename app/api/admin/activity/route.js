import prisma from '@/lib/prisma';
import { route, json, requireUser } from '@/lib/api';

// GET /api/admin/activity?targetType=&q=&page= — the moderation audit log
export const GET = route(async (req) => {
  await requireUser('ADMIN');
  const sp = new URL(req.url).searchParams;
  const page = Math.max(1, parseInt(sp.get('page')) || 1);
  const take = 40;
  const where = {
    ...(sp.get('targetType') ? { targetType: sp.get('targetType') } : {}),
    ...(sp.get('q') ? { OR: [{ targetName: { contains: sp.get('q'), mode: 'insensitive' } }, { reason: { contains: sp.get('q'), mode: 'insensitive' } }] } : {}),
  };
  const [actions, total] = await Promise.all([
    prisma.adminAction.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * take, take, include: { admin: { select: { name: true } } } }),
    prisma.adminAction.count({ where }),
  ]);
  return json({ actions, total, page, pages: Math.max(1, Math.ceil(total / take)) });
});
