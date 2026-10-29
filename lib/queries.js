import prisma from './prisma';

export const courseCardSelect = {
  id: true,
  title: true,
  slug: true,
  subtitle: true,
  thumbnail: true,
  price: true,
  discountPrice: true,
  level: true,
  language: true,
  avgRating: true,
  reviewCount: true,
  studentCount: true,
  featured: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  instructor: { select: { id: true, name: true, avatar: true, status: true } },
  category: { select: { id: true, name: true, slug: true } },
};

const SORTS = {
  popular: [{ studentCount: 'desc' }, { avgRating: 'desc' }],
  rating: [{ avgRating: 'desc' }, { reviewCount: 'desc' }],
  newest: [{ createdAt: 'desc' }],
  'price-asc': [{ price: 'asc' }],
  'price-desc': [{ price: 'desc' }],
};

/** Search & filter published courses. Used by the API and the catalog page. */
export async function searchCourses(params = {}) {
  const page = Math.max(1, parseInt(params.page) || 1);
  const limit = Math.min(48, Math.max(1, parseInt(params.limit) || 12));
  const where = { status: 'PUBLISHED', instructor: { status: 'ACTIVE' } };
  const AND = [];

  if (params.q) {
    const q = String(params.q).trim();
    AND.push({
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { subtitle: { contains: q, mode: 'insensitive' } },
        { tags: { has: q.toLowerCase() } },
        { instructor: { name: { contains: q, mode: 'insensitive' } } },
      ],
    });
  }
  if (params.category) AND.push({ category: { slug: params.category } });
  if (params.level) AND.push({ level: params.level });
  if (params.price === 'free') AND.push({ price: 0 });
  if (params.price === 'paid') AND.push({ price: { gt: 0 } });
  if (params.rating) AND.push({ avgRating: { gte: Number(params.rating) } });
  if (params.language) AND.push({ language: params.language });
  if (params.instructor) AND.push({ instructorId: params.instructor });
  if (AND.length) where.AND = AND;

  const orderBy = SORTS[params.sort] || SORTS.popular;

  const [courses, total] = await Promise.all([
    prisma.course.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit, select: courseCardSelect }),
    prisma.course.count({ where }),
  ]);

  return { courses, total, page, pages: Math.max(1, Math.ceil(total / limit)), limit };
}

/** Total lectures + duration for a set of courses: { [courseId]: { lectures, duration } } */
export async function courseStats(courseIds) {
  if (!courseIds.length) return {};
  const lectures = await prisma.lecture.findMany({
    where: { section: { courseId: { in: courseIds } } },
    select: { duration: true, section: { select: { courseId: true } } },
  });
  const out = {};
  for (const id of courseIds) out[id] = { lectures: 0, duration: 0 };
  for (const l of lectures) {
    const s = out[l.section.courseId];
    s.lectures += 1;
    s.duration += l.duration;
  }
  return out;
}

export async function withStats(courses) {
  const stats = await courseStats(courses.map((c) => c.id));
  return courses.map((c) => ({ ...c, ...stats[c.id] }));
}
