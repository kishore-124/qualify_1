import prisma from '@/lib/prisma';
import { route, json, readBody, requireUser, ApiError } from '@/lib/api';
import { refreshCourseRating, notify } from '@/lib/course';

// GET /api/courses/:id/reviews?page=1
export const GET = route(async (req, { id }) => {
  const page = Math.max(1, parseInt(new URL(req.url).searchParams.get('page')) || 1);
  const take = 10;
  const [reviews, total, groups] = await Promise.all([
    prisma.review.findMany({
      where: { courseId: id, hidden: false },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * take,
      take,
      include: { user: { select: { id: true, name: true, avatar: true } } },
    }),
    prisma.review.count({ where: { courseId: id, hidden: false } }),
    prisma.review.groupBy({ by: ['rating'], where: { courseId: id, hidden: false }, _count: { _all: true } }),
  ]);
  const distribution = [5, 4, 3, 2, 1].map((r) => ({ rating: r, count: groups.find((g) => g.rating === r)?._count._all || 0 }));
  return json({ reviews, total, page, pages: Math.ceil(total / take), distribution });
});

// POST /api/courses/:id/reviews  { rating 1-5, comment } — enrolled students only (create or update)
export const POST = route(async (req, { id }) => {
  const user = await requireUser();
  const { rating, comment } = await readBody(req);
  const r = parseInt(rating);
  if (!(r >= 1 && r <= 5)) throw new ApiError('Rating must be between 1 and 5', 422);

  const enrollment = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId: id } } });
  if (!enrollment) throw new ApiError('Only enrolled students can review this course', 403);

  const existing = await prisma.review.findUnique({ where: { userId_courseId: { userId: user.id, courseId: id } } });
  const review = await prisma.review.upsert({
    where: { userId_courseId: { userId: user.id, courseId: id } },
    create: { rating: r, comment: comment?.trim() || null, userId: user.id, courseId: id },
    update: { rating: r, comment: comment?.trim() || null },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });
  await refreshCourseRating(id);

  if (!existing) {
    const course = await prisma.course.findUnique({ where: { id }, select: { title: true, slug: true, instructorId: true } });
    await notify(course.instructorId, `New ${r}★ review`, `${user.name} reviewed "${course.title}".`, `/courses/${course.slug}#reviews`);
  }
  return json({ review }, existing ? 200 : 201);
});

// DELETE /api/courses/:id/reviews — remove my review
export const DELETE = route(async (req, { id }) => {
  const user = await requireUser();
  await prisma.review.delete({ where: { userId_courseId: { userId: user.id, courseId: id } } });
  await refreshCourseRating(id);
  return json({ ok: true });
});
