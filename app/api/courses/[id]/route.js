import prisma from '@/lib/prisma';
import { route, json, readBody, requireUser, requireActiveInstructor, assertCourseOwner, ApiError } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';

const fullInclude = {
  category: true,
  instructor: { select: { id: true, name: true, avatar: true, headline: true } },
  sections: {
    orderBy: { position: 'asc' },
    include: { lectures: { orderBy: { position: 'asc' } } },
  },
  coupons: true,
  _count: { select: { enrollments: true, reviews: true } },
};

// GET /api/courses/:id — full course (owner/admin sees drafts & video urls)
export const GET = route(async (req, { id }) => {
  const user = await getCurrentUser();
  const course = await prisma.course.findUnique({ where: { id }, include: fullInclude });
  if (!course) throw new ApiError('Course not found', 404);
  const isOwner = user && (user.id === course.instructorId || user.role === 'ADMIN');
  if (!isOwner) {
    if (course.status !== 'PUBLISHED') throw new ApiError('Course not found', 404);
    // Hide paid lecture videos from the public
    course.sections.forEach((s) =>
      s.lectures.forEach((l) => {
        if (!l.isPreview) {
          l.videoUrl = null;
          l.resourceUrl = null;
        }
      })
    );
    delete course.coupons;
  }
  return json({ course, isOwner: !!isOwner });
});

const EDITABLE = [
  'title', 'subtitle', 'description', 'thumbnail', 'previewVideo', 'price', 'discountPrice',
  'level', 'language', 'categoryId', 'requirements', 'outcomes', 'tags',
];

// PUT /api/courses/:id (owner)
export const PUT = route(async (req, { id }) => {
  const user = await requireActiveInstructor();
  const course = await prisma.course.findUnique({ where: { id } });
  assertCourseOwner(course, user);
  const b = await readBody(req);

  const data = {};
  for (const f of EDITABLE) if (b[f] !== undefined) data[f] = b[f];
  if (data.title !== undefined && data.title.trim().length < 5) throw new ApiError('Title must be at least 5 characters', 422);
  if (data.price !== undefined) data.price = Math.max(0, Number(data.price) || 0);
  if (data.discountPrice !== undefined) {
    data.discountPrice = data.discountPrice === '' || data.discountPrice === null ? null : Math.max(0, Number(data.discountPrice));
  }
  for (const f of ['requirements', 'outcomes', 'tags']) {
    if (data[f] !== undefined) {
      const arr = Array.isArray(data[f]) ? data[f] : String(data[f]).split('\n');
      data[f] = arr.map((s) => s.trim()).filter(Boolean);
      if (f === 'tags') data[f] = data[f].map((t) => t.toLowerCase());
    }
  }
  if (data.categoryId === '') data.categoryId = null;
  // Major edits to a rejected course send it back to draft
  if (course.status === 'REJECTED') data.status = 'DRAFT';

  const updated = await prisma.course.update({ where: { id }, data, include: fullInclude });
  return json({ course: updated });
});

// DELETE /api/courses/:id (owner) — only when no students are enrolled
export const DELETE = route(async (req, { id }) => {
  const user = await requireActiveInstructor();
  const course = await prisma.course.findUnique({ where: { id }, include: { _count: { select: { enrollments: true } } } });
  assertCourseOwner(course, user);
  if (course._count.enrollments > 0 && user.role !== 'ADMIN') {
    throw new ApiError('This course has enrolled students. Unpublish it instead of deleting.', 409);
  }
  await prisma.course.delete({ where: { id } });
  return json({ ok: true });
});
