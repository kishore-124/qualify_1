import prisma from '@/lib/prisma';
import { route, json, readBody, requireUser, ApiError } from '@/lib/api';
import { assertLectureAccess } from '@/lib/access';
import { notify } from '@/lib/course';

// POST /api/questions/:id/answers  { body }
export const POST = route(async (req, { id }) => {
  const user = await requireUser();
  const question = await prisma.question.findUnique({ where: { id } });
  if (!question) throw new ApiError('Question not found', 404);
  const { course } = await assertLectureAccess(question.lectureId, user);
  const { body } = await readBody(req);
  if (!body?.trim()) throw new ApiError('Answer cannot be empty', 422);

  const answer = await prisma.answer.create({
    data: { body: body.trim(), userId: user.id, questionId: id, isInstructor: course.instructorId === user.id },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });
  if (question.userId !== user.id) {
    await notify(question.userId, 'New answer to your question', `${user.name} replied to "${question.title.slice(0, 60)}"`, `/learn/${course.slug}?lecture=${question.lectureId}&tab=qa`);
  }
  return json({ answer }, 201);
});
