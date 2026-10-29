import { cookies } from 'next/headers';
import prisma from './prisma';
import { COOKIE_NAME, signToken, verifyToken } from './jwt';

export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatar: true,
  headline: true,
  bio: true,
  website: true,
  status: true,
  statusReason: true,
  createdAt: true,
};

/** Returns the logged-in user (from the auth cookie) or null. */
export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: payload.id }, select: publicUserSelect });
  if (!user || user.status === 'BANNED') return null; // banned accounts are signed out everywhere
  return user;
}

/** Attaches a fresh signed auth cookie to a NextResponse. */
export async function setAuthCookie(res, user) {
  const token = await signToken({ id: user.id, role: user.role, name: user.name });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

export function clearAuthCookie(res) {
  res.cookies.set(COOKIE_NAME, '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
