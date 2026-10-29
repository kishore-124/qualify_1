import prisma from '@/lib/prisma';
import { route, json, readBody, requireUser, ApiError } from '@/lib/api';
import { moderateUser, logAction } from '@/lib/moderation';

// GET /api/admin/users?q=&role=&page=
export const GET = route(async (req) => {
  await requireUser('ADMIN');
  const sp = new URL(req.url).searchParams;
  const q = sp.get('q');
  const role = sp.get('role');
  const status = sp.get('status');
  const page = Math.max(1, parseInt(sp.get('page')) || 1);
  const take = 20;
  const where = {
    ...(role ? { role } : {}),
    ...(status ? { status } : {}),
    ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }] } : {}),
  };
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * take,
      take,
      select: {
        id: true, name: true, email: true, role: true, avatar: true, createdAt: true, status: true, payoutsHeld: true,
        _count: { select: { enrollments: true, courses: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);
  return json({ users, total, page, pages: Math.max(1, Math.ceil(total / take)) });
});

// PATCH /api/admin/users  { id, role } — role change (logged)
export const PATCH = route(async (req) => {
  const admin = await requireUser('ADMIN');
  const { id, role } = await readBody(req);
  const user = await moderateUser(admin, id, 'role', { role });
  return json({ user: { id: user.id, role: user.role } });
});

// DELETE /api/admin/users?id= — permanently delete an account (prefer ban, which keeps the history)
export const DELETE = route(async (req) => {
  const admin = await requireUser('ADMIN');
  const id = new URL(req.url).searchParams.get('id');
  if (!id || id === admin.id) throw new ApiError('Invalid user', 400);
  const user = await prisma.user.findUnique({ where: { id }, select: { name: true, email: true } });
  if (!user) throw new ApiError('User not found', 404);
  await prisma.user.delete({ where: { id } });
  await logAction(admin, 'user.delete', 'USER', id, `${user.name} <${user.email}>`, null);
  return json({ ok: true });
});
