import prisma from '@/lib/prisma';
import { route, json, requireUser } from '@/lib/api';
import { courseCardSelect } from '@/lib/queries';

// GET /api/enrollments — my learning (with progress)
export const GET = route(async () => {
  const user = await requireUser();
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { course: { select: courseCardSelect } },
  });
  const stats = {
    total: enrollments.length,
    completed: enrollments.filter((e) => e.progress >= 100).length,
    inProgress: enrollments.filter((e) => e.progress > 0 && e.progress < 100).length,
  };
  return json({ enrollments, stats });
});
