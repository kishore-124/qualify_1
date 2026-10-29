import prisma from '@/lib/prisma';
import { route, json, readBody, requireUser } from '@/lib/api';
import { findValidCoupon, priceCart } from '@/lib/coupons';

// POST /api/coupons/validate  { code } — applies a coupon to my current cart
export const POST = route(async (req) => {
  const user = await requireUser();
  const { code } = await readBody(req);
  const coupon = await findValidCoupon(code);
  const items = await prisma.cartItem.findMany({ where: { userId: user.id, savedForLater: false }, include: { course: true } });
  const pricing = priceCart(items.map((i) => i.course), coupon);
  return json({
    coupon: { code: coupon.code, discountPercent: coupon.discountPercent, courseId: coupon.courseId },
    ...pricing,
  });
});
