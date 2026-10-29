import prisma from '@/lib/prisma';
import { route, json, requireUser, ApiError } from '@/lib/api';

// GET /api/learn/:slug — everything the course player needs (enrolled students, owner or admin)
export const GET = route(async (req, { slug }) => {
  const user = await requireUser();
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      instructor: { select: { id: true, name: true, avatar: true, headline: true } },
      sections: { orderBy: { position: 'asc' }, include: { lectures: { orderBy: { position: 'asc' } } } },
    },
  });
  if (!course) throw new ApiError('Course not found', 404);

  const isOwner = course.instructorId === user.id || user.role === 'ADMIN';
  const enrollment = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId: course.id } } });
  if (!enrollment && !isOwner) throw new ApiError('You are not enrolled in this course', 403);

  const lectureIds = course.sections.flatMap((s) => s.lectures.map((l) => l.id));
  const [done, myReview, certificate] = await Promise.all([
    prisma.lectureProgress.findMany({ where: { userId: user.id, completed: true, lectureId: { in: lectureIds } }, select: { lectureId: true } }),
    prisma.review.findUnique({ where: { userId_courseId: { userId: user.id, courseId: course.id } } }),
    prisma.certificate.findUnique({ where: { userId_courseId: { userId: user.id, courseId: course.id } } }),
  ]);
  const doneSet = new Set(done.map((d) => d.lectureId));
  course.sections.forEach((s) => s.lectures.forEach((l) => (l.completed = doneSet.has(l.id))));

  return json({
    course,
    isOwner,
    enrolled: !!enrollment,
    progress: enrollment?.progress ?? 0,
    lastLectureId: enrollment?.lastLectureId ?? null,
    myReview,
    certificateId: certificate?.id ?? null,
  });
});
