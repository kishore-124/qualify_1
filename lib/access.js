import prisma from './prisma';
import { ApiError } from './api';

/** Loads a lecture and verifies the user is enrolled in (or owns) its course. */
export async function assertLectureAccess(lectureId, user) {
  const lecture = await prisma.lecture.findUnique({
    where: { id: lectureId },
    include: { section: { include: { course: { select: { id: true, title: true, slug: true, instructorId: true } } } } },
  });
  if (!lecture) throw new ApiError('Lecture not found', 404);
  const course = lecture.section.course;
  const isOwner = course.instructorId === user.id || user.role === 'ADMIN';
  if (!isOwner) {
    const enrollment = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId: course.id } } });
    if (!enrollment) throw new ApiError('You are not enrolled in this course', 403);
  }
  return { lecture, course, isOwner };
}
