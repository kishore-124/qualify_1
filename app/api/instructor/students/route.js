import prisma from '@/lib/prisma';
import { route, json, requireUser } from '@/lib/api';

// GET /api/instructor/students?courseId= — students enrolled in my courses
export const GET = route(async (req) => {
  const user = await requireUser('INSTRUCTOR', 'ADMIN');
  const courseId = new URL(req.url).searchParams.get('courseId');
  const enrollments = await prisma.enrollment.findMany({
    where: { course: { instructorId: user.id }, ...(courseId ? { courseId } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true } },
      course: { select: { id: true, title: true } },
    },
  });
  return json({ enrollments });
});
