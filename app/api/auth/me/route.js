import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { route, json } from '@/lib/api';
import { getCurrentUser, setAuthCookie } from '@/lib/auth';
import { COOKIE_NAME, verifyToken } from '@/lib/jwt';

// GET /api/auth/me — current user + badge counts (cart, unread notifications)
export const GET = route(async () => {
  const user = await getCurrentUser();
  if (!user) return json({ user: null, counts: { cart: 0, notifications: 0, wishlist: 0 } });

  const [cart, notifications, wishlist] = await Promise.all([
    prisma.cartItem.count({ where: { userId: user.id, savedForLater: false } }),
    prisma.notification.count({ where: { userId: user.id, read: false } }),
    prisma.wishlistItem.count({ where: { userId: user.id } }),
  ]);
  const res = json({ user, counts: { cart, notifications, wishlist } });

  // If an admin changed this user's role, refresh the token so page guards stay in sync.
  const store = await cookies();
  const payload = await verifyToken(store.get(COOKIE_NAME)?.value);
  if (payload && payload.role !== user.role) await setAuthCookie(res, user);
  return res;
});
