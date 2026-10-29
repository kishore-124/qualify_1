import prisma from './prisma';
import { ApiError } from './api';
import { effectivePrice } from './utils';

export async function findValidCoupon(code) {
  if (!code) return null;
  const coupon = await prisma.coupon.findUnique({ where: { code: String(code).trim().toUpperCase() } });
  if (!coupon || !coupon.active) throw new ApiError('This coupon code is not valid', 404);
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new ApiError('This coupon has expired', 410);
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    throw new ApiError('This coupon has reached its usage limit', 410);
  }
  return coupon;
}

/**
 * Prices a list of courses with an optional coupon.
 * Returns per-course final prices + totals.
 */
export function priceCart(courses, coupon) {
  let subtotal = 0;
  let discount = 0;
  const items = courses.map((course) => {
    const base = effectivePrice(course);
    subtotal += base;
    let final = base;
    if (coupon && (!coupon.courseId || coupon.courseId === course.id)) {
      const off = Math.round(base * coupon.discountPercent) / 100; // cents-accurate
      final = base - off;
      discount += off;
    }
    return { courseId: course.id, base, price: final };
  });
  const r2 = (n) => Math.round(n * 100) / 100;
  return { items: items.map((i) => ({ ...i, price: r2(i.price) })), subtotal: r2(subtotal), discount: r2(discount), total: Math.max(0, r2(subtotal - discount)) };
}
