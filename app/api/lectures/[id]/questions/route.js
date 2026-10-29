import prisma from '@/lib/prisma';
import { route, json, readBody, requireUser, ApiError } from '@/lib/api';
import { assertLectureAccess } from '@/lib/access';
import { notify } from '@/lib/course';

const userSel = { select: { id: true, name: true, avatar: true } };

// GET /api/lectures/:id/questions?scope=lecture|course
export const GET = route(async (req, { id }) => {
  const user = await requireUser();
  const { course } = await assertLectureAccess(id, user);
  const scope = new URL(req.url).searchParams.get('scope') || 'lecture';
  const questions = await prisma.question.findMany({
    where: scope === 'course' ? { courseId: course.id } : { lectureId: id },
    orderBy: { createdAt: 'desc' },
    include: {
      user: userSel,
      lecture: { select: { id: true, title: true } },
      answers: { orderBy: { createdAt: 'asc' }, include: { user: userSel } },
    },
  });
  return json({ questions });
});

// POST /api/lectures/:id/questions  { title, body }
export const POST = route(async (req, { id }) => {
  const user = await requireUser();
  const { course } = await assertLectureAccess(id, user);
  const { title, body } = await readBody(req);
  if (!title?.trim()) throw new ApiError('Please enter your question', 422);
  const question = await prisma.question.create({
    data: { title: title.trim(), body: body?.trim() || null, userId: user.id, lectureId: id, courseId: course.id },
    include: { user: userSel, lecture: { select: { id: true, title: true } }, answers: { include: { user: userSel } } },
  });
  if (course.instructorId !== user.id) {
    await notify(course.instructorId, 'New question from a student', `${user.name} asked: "${title.trim().slice(0, 80)}"`, `/learn/${course.slug}?lecture=${id}&tab=qa`);
  }
  return json({ question }, 201);
});
