import prisma from '@/lib/prisma';
import { route, json } from '@/lib/api';
import { courseCardSelect, withStats } from '@/lib/queries';
import { cartSummary, recommendFor } from '@/lib/cart';

// GET /api/cart/preview?ids=a,b,c — prices a guest cart (no login needed)
export const GET = route(async (req) => {
  const ids = (new URL(req.url).searchParams.get('ids') || '').split(',').filter(Boolean).slice(0, 50);
  const rows = ids.length
    ? await prisma.course.findMany({ where: { id: { in: ids }, status: 'PUBLISHED', instructor: { status: 'ACTIVE' } }, select: courseCardSelect })
    : [];
  const courses = await withStats(rows);
  const ordered = ids.map((id) => courses.find((c) => c.id === id)).filter(Boolean);
  return json({
    items: ordered.map((course) => ({ id: course.id, courseId: course.id, savedForLater: false, course })),
    saved: [],
    ...cartSummary(ordered),
    recommendations: await recommendFor(ordered, ids),
  });
});
