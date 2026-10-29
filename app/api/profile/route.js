import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { route, json, readBody, requireUser, ApiError } from '@/lib/api';
import { publicUserSelect } from '@/lib/auth';

// GET /api/profile
export const GET = route(async () => {
  const user = await requireUser();
  return json({ user });
});

// PUT /api/profile  { name, headline, bio, avatar, website, currentPassword?, newPassword? }
export const PUT = route(async (req) => {
  const me = await requireUser();
  const b = await readBody(req);
  const data = {};
  for (const f of ['name', 'headline', 'bio', 'avatar', 'website']) {
    if (b[f] !== undefined) data[f] = typeof b[f] === 'string' ? b[f].trim() || null : b[f];
  }
  if (data.name === null) throw new ApiError('Name cannot be empty', 422);

  if (b.newPassword) {
    if (b.newPassword.length < 6) throw new ApiError('New password must be at least 6 characters', 422);
    const full = await prisma.user.findUnique({ where: { id: me.id } });
    if (!(await bcrypt.compare(b.currentPassword || '', full.password))) {
      throw new ApiError('Current password is incorrect', 400);
    }
    data.password = await bcrypt.hash(b.newPassword, 10);
  }

  const user = await prisma.user.update({ where: { id: me.id }, data, select: publicUserSelect });
  return json({ user });
});
