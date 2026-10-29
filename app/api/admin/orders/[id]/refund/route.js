import prisma from '@/lib/prisma';
import { route, json, requireUser, ApiError } from '@/lib/api';
import { refundOrder } from '@/lib/payments';

// POST /api/admin/orders/:id/refund — refund the student and reverse instructor earnings
export const POST = route(async (req, { id }) => {
  await requireUser('ADMIN');
  const existing = await prisma.order.findUnique({ where: { id }, select: { status: true } });
  if (!existing) throw new ApiError('Order not found', 404);
  if (existing.status !== 'PAID') throw new ApiError(`This order is ${existing.status.toLowerCase()} and can't be refunded`, 400);
  const order = await refundOrder(id);
  return json({ order });
});
