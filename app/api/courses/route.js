import prisma from '@/lib/prisma';
import { route, json, readBody, requireUser, requireActiveInstructor, ApiError } from '@/lib/api';
import { searchCourses, withStats } from '@/lib/queries';
import { uniqueCourseSlug } from '@/lib/course';

// GET /api/courses?q=&category=&level=&price=free|paid&rating=4&sort=popular|rating|newest|price-asc|price-desc&page=1&limit=12
export const GET = route(async (req) => {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const result = await searchCourses(params);
  result.courses = await withStats(result.courses);
  return json(result);
});

// POST /api/courses (instructor)  { title, categoryId?, subtitle?, level? }
export const POST = route(async (req) => {
  const user = await requireActiveInstructor();
  const b = await readBody(req);
  if (!b.title?.trim() || b.title.trim().length < 5) throw new ApiError('Title must be at least 5 characters', 422);

  const course = await prisma.course.create({
    data: {
      title: b.title.trim(),
      slug: await uniqueCourseSlug(b.title),
      subtitle: b.subtitle || null,
      level: b.level || 'ALL_LEVELS',
      categoryId: b.categoryId || null,
      instructorId: user.id,
    },
  });
  return json({ course }, 201);
});
