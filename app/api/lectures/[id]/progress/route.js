import prisma from '@/lib/prisma';
import { route, json, readBody, requireUser, ApiError } from '@/lib/api';
import { refreshProgress } from '@/lib/course';

async function loadForStudent(id, user) {
  const lecture = await prisma.lecture.findUnique({ where: { id }, include: { section: { select: { courseId: true } } } });
  if (!lecture) throw new ApiError('Lecture not found', 404);
  const courseId = lecture.section.courseId;
  const enrollment = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId } } });
  if (!enrollment) throw new ApiError('Enroll in this course to track progress', 403);
  return { lecture, courseId };
}

// POST /api/lectures/:id/progress  { completed?: boolean } — toggles when omitted
export const POST = route(async (req, { id }) => {
  const user = await requireUser();
  const { courseId } = await loadForStudent(id, user);
  const b = await readBody(req);
  const existing = await prisma.lectureProgress.findUnique({ where: { userId_lectureId: { userId: user.id, lectureId: id } } });
  const completed = typeof b.completed === 'boolean' ? b.completed : !existing?.completed;

  await prisma.lectureProgress.upsert({
    where: { userId_lectureId: { userId: user.id, lectureId: id } },
    create: { userId: user.id, lectureId: id, completed, completedAt: completed ? new Date() : null },
    update: { completed, completedAt: completed ? new Date() : null },
  });
  const result = await refreshProgress(user.id, courseId);
  return json({ lectureId: id, completed, ...result });
});

// PUT /api/lectures/:id/progress — remember the last watched lecture ("continue where you left off")
export const PUT = route(async (req, { id }) => {
  const user = await requireUser();
  const { courseId } = await loadForStudent(id, user);
  await prisma.enrollment.update({
    where: { userId_courseId: { userId: user.id, courseId } },
    data: { lastLectureId: id },
  });
  return json({ ok: true });
});
