import crypto from 'crypto';
import prisma from './prisma';
import { slugify } from './utils';

export async function uniqueCourseSlug(title, ignoreId) {
  const base = slugify(title) || 'course';
  let slug = base;
  let i = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.course.findUnique({ where: { slug }, select: { id: true } });
    if (!existing || existing.id === ignoreId) return slug;
    i += 1;
    slug = `${base}-${i}`;
  }
}

export async function refreshCourseRating(courseId) {
  const agg = await prisma.review.aggregate({
    where: { courseId, hidden: false },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await prisma.course.update({
    where: { id: courseId },
    data: {
      avgRating: Math.round((agg._avg.rating || 0) * 10) / 10,
      reviewCount: agg._count._all,
    },
  });
}

export async function notify(userId, title, message, link) {
  try {
    await prisma.notification.create({ data: { userId, title, message, link } });
  } catch (e) {
    console.error('notify failed', e);
  }
}

/** Enrolls a user (idempotent). Returns the enrollment. */
export async function enrollUser(userId, courseId) {
  const existing = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } });
  if (existing) return existing;
  const enrollment = await prisma.enrollment.create({ data: { userId, courseId } });
  const course = await prisma.course.update({
    where: { id: courseId },
    data: { studentCount: { increment: 1 } },
    select: { title: true, slug: true, instructorId: true },
  });
  await prisma.cartItem.deleteMany({ where: { userId, courseId } });
  await prisma.wishlistItem.deleteMany({ where: { userId, courseId } });
  await notify(userId, 'Enrollment confirmed 🎉', `You now have lifetime access to "${course.title}".`, `/learn/${course.slug}`);
  await notify(course.instructorId, 'New student', `A new student enrolled in "${course.title}".`, '/instructor');
  return enrollment;
}

/** Recalculates the progress % for a user in a course, issuing a certificate at 100%. */
export async function refreshProgress(userId, courseId) {
  const [total, done] = await Promise.all([
    prisma.lecture.count({ where: { section: { courseId } } }),
    prisma.lectureProgress.count({ where: { userId, completed: true, lecture: { section: { courseId } } } }),
  ]);
  const progress = total ? Math.round((done / total) * 100) : 0;
  const completed = total > 0 && done >= total;

  await prisma.enrollment.updateMany({
    where: { userId, courseId },
    data: { progress, completedAt: completed ? new Date() : null },
  });

  let certificate = await prisma.certificate.findUnique({ where: { userId_courseId: { userId, courseId } } });
  if (completed && !certificate) {
    certificate = await prisma.certificate.create({
      data: { userId, courseId, serial: `QF-${crypto.randomBytes(5).toString('hex').toUpperCase()}` },
    });
    const course = await prisma.course.findUnique({ where: { id: courseId }, select: { title: true } });
    await notify(userId, 'Certificate earned 🏆', `Congratulations on completing "${course.title}"!`, `/certificates/${certificate.id}`);
  }
  return { progress, completedLectures: done, totalLectures: total, certificateId: certificate?.id || null };
}
