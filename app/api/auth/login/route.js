import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { route, json, readBody, ApiError } from '@/lib/api';
import { setAuthCookie } from '@/lib/auth';

// POST /api/auth/login  { email, password }
export const POST = route(async (req) => {
  const { email, password } = await readBody(req);
  if (!email || !password) throw new ApiError('Email and password are required', 422);

  const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase().trim() } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new ApiError('Invalid email or password', 401);
  }
  if (user.status === 'BANNED') {
    throw new ApiError(`This account has been banned${user.statusReason ? `: ${user.statusReason}` : ''}. Contact support@qualify.dev if you think this is a mistake.`, 403);
  }
  const { password: _pw, ...safe } = user;
  return setAuthCookie(json({ user: safe }), user);
});
