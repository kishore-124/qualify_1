import prisma from '@/lib/prisma';
import { route, json, readBody, requireUser, ApiError } from '@/lib/api';
import { courseCardSelect } from '@/lib/queries';

// GET /api/wishlist
export const GET = route(async () => {
  const user = await requireUser();
  const items = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { course: { select: courseCardSelect } },
  });
  return json({ items });
});

// POST /api/wishlist  { courseId } — toggles the course in my wishlist
export const POST = route(async (req) => {
  const user = await requireUser();
  const { courseId } = await readBody(req);
  if (!courseId) throw new ApiError('courseId is required', 422);
  const key = { userId_courseId: { userId: user.id, courseId } };
  const existing = await prisma.wishlistItem.findUnique({ where: key });
  if (existing) {
    await prisma.wishlistItem.delete({ where: key });
    return json({ inWishlist: false });
  }
  await prisma.wishlistItem.create({ data: { userId: user.id, courseId } });
  return json({ inWishlist: true }, 201);
});
