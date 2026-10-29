import prisma from '@/lib/prisma';
import { route, json, readBody, requireUser, ApiError } from '@/lib/api';
import { moderateCourse } from '@/lib/moderation';

// GET /api/admin/courses?status=&q=
export const GET = route(async (req) => {
  await requireUser('ADMIN');
  const sp = new URL(req.url).searchParams;
  const status = sp.get('status');
  const q = sp.get('q');
  const courses = await prisma.course.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
    select: {
      id: true, title: true, slug: true, thumbnail: true, status: true, featured: true, price: true, discountPrice: true,
      studentCount: true, avgRating: true, reviewCount: true, updatedAt: true,
      instructor: { select: { id: true, name: true, status: true } },
      category: { select: { name: true } },
    },
  });
  return json({ courses });
});

// PATCH /api/admin/courses  { id, status?, featured?, rejectReason? } — kept for the list view; logs via moderation
export const PATCH = route(async (req) => {
  const admin = await requireUser('ADMIN');
  const { id, status, featured, rejectReason } = await readBody(req);
  let course;
  if (status) {
    const current = await prisma.course.findUnique({ where: { id }, select: { status: true } });
    if (!current) throw new ApiError('Course not found', 404);
    const action =
      status === 'PUBLISHED' ? (current.status === 'SUSPENDED' ? 'restore' : 'approve')
      : status === 'REJECTED' ? 'reject'
      : status === 'SUSPENDED' ? 'suspend'
      : status === 'DRAFT' ? 'unpublish'
      : null;
    if (!action) throw new ApiError('Invalid status', 422);
    course = await moderateCourse(admin, id, action, rejectReason);
  }
  if (featured !== undefined) course = await moderateCourse(admin, id, featured ? 'feature' : 'unfeature');
  return json({ course });
});
