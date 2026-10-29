import prisma from '@/lib/prisma';
import { route, json, requireUser } from '@/lib/api';

// GET /api/orders — my purchase history
export const GET = route(async () => {
  const user = await requireUser();
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { items: { include: { course: { select: { id: true, title: true, slug: true, thumbnail: true } } } } },
  });
  return json({ orders });
});
