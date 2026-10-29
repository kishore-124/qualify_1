import prisma from './prisma';
import { ApiError } from './api';
import { notify, refreshCourseRating } from './course';

/** Writes one entry to the admin audit log. */
export async function logAction(admin, action, targetType, targetId, targetName, reason) {
  await prisma.adminAction.create({
    data: { adminId: admin.id, action, targetType, targetId, targetName: targetName?.slice(0, 200) || null, reason: reason || null },
  });
}

const needReason = (reason, what) => {
  if (!reason || String(reason).trim().length < 5) throw new ApiError(`Please give a reason for ${what} (at least 5 characters) — the instructor will see it.`, 422);
  return String(reason).trim();
};

// ───────────────────────────── Courses ─────────────────────────────

export const COURSE_ACTIONS = ['approve', 'reject', 'suspend', 'restore', 'unpublish', 'feature', 'unfeature'];

export async function moderateCourse(admin, courseId, action, reason) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new ApiError('Course not found', 404);
  let data;
  let message;

  switch (action) {
    case 'approve':
      if (!['PENDING', 'DRAFT', 'REJECTED'].includes(course.status)) throw new ApiError(`A ${course.status.toLowerCase()} course can't be approved`, 400);
      data = { status: 'PUBLISHED', rejectReason: null };
      message = ['Course approved ✅', `"${course.title}" is now live on Qualify.`, `/courses/${course.slug}`];
      break;
    case 'reject':
      reason = needReason(reason, 'requesting changes');
      data = { status: 'REJECTED', rejectReason: reason };
      message = ['Changes requested on your course', `"${course.title}": ${reason}`, `/instructor/courses/${course.id}?tab=publish`];
      break;
    case 'suspend':
      reason = needReason(reason, 'taking a course down');
      data = { status: 'SUSPENDED', rejectReason: reason, featured: false };
      message = ['Your course was taken down', `"${course.title}" is no longer for sale: ${reason}. Existing students keep access. Reply to support to appeal.`, `/instructor/courses/${course.id}?tab=publish`];
      await prisma.cartItem.deleteMany({ where: { courseId } });
      break;
    case 'restore':
      if (course.status !== 'SUSPENDED') throw new ApiError('Only suspended courses can be restored', 400);
      data = { status: 'PUBLISHED', rejectReason: null };
      message = ['Your course is back online', `"${course.title}" is available to students again.`, `/courses/${course.slug}`];
      break;
    case 'unpublish':
      data = { status: 'DRAFT' };
      message = ['Your course was moved to draft', `"${course.title}" was unpublished by Qualify${reason ? `: ${reason}` : '.'}`, `/instructor/courses/${course.id}`];
      break;
    case 'feature':
    case 'unfeature':
      data = { featured: action === 'feature' };
      break;
    default:
      throw new ApiError('Unknown action', 422);
  }

  const updated = await prisma.course.update({ where: { id: courseId }, data });
  if (message) await notify(course.instructorId, ...message);
  await logAction(admin, `course.${action}`, 'COURSE', course.id, course.title, reason);
  return updated;
}

// ───────────────────────────── Users ─────────────────────────────

export const USER_ACTIONS = ['warn', 'suspend', 'ban', 'reactivate', 'hold-payouts', 'release-payouts', 'role'];

export async function moderateUser(admin, userId, action, { reason, holdPayouts = true, role } = {}) {
  if (userId === admin.id) throw new ApiError('You can’t take moderation actions on your own account', 400);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError('User not found', 404);
  if (user.role === 'ADMIN' && action !== 'role') throw new ApiError('Change this admin’s role before moderating them', 400);
  let data;

  switch (action) {
    case 'warn':
      reason = needReason(reason, 'the warning');
      await notify(userId, 'Warning from Qualify', `${reason} Repeated issues can lead to your account being paused.`, '/profile');
      break;
    case 'suspend':
      reason = needReason(reason, 'pausing this account');
      data = { status: 'SUSPENDED', statusReason: reason, statusChangedAt: new Date(), payoutsHeld: !!holdPayouts };
      await notify(userId, 'Your instructor account is paused', `${reason} Your courses can’t be bought and you can’t edit them until this is resolved. Your students keep access.`, '/profile');
      break;
    case 'ban':
      reason = needReason(reason, 'banning this account');
      data = { status: 'BANNED', statusReason: reason, statusChangedAt: new Date(), payoutsHeld: true };
      break;
    case 'reactivate':
      data = { status: 'ACTIVE', statusReason: null, statusChangedAt: new Date(), payoutsHeld: false };
      await notify(userId, 'Your account is active again', 'Thanks for your patience — everything is back to normal.', '/instructor');
      break;
    case 'hold-payouts':
      data = { payoutsHeld: true };
      await notify(userId, 'Payouts on hold', reason || 'Your payouts are on hold while we review recent activity.', '/instructor/earnings');
      break;
    case 'release-payouts':
      data = { payoutsHeld: false };
      await notify(userId, 'Payouts resumed', 'Your pending earnings will be sent with the next payout.', '/instructor/earnings');
      break;
    case 'role':
      if (!['STUDENT', 'INSTRUCTOR', 'ADMIN'].includes(role)) throw new ApiError('Invalid role', 422);
      data = { role };
      await notify(userId, 'Your role was updated', `You are now ${role.toLowerCase()} on Qualify.`, role === 'STUDENT' ? '/dashboard' : role === 'ADMIN' ? '/admin' : '/instructor');
      reason = reason || `Role changed to ${role}`;
      break;
    default:
      throw new ApiError('Unknown action', 422);
  }

  const updated = data ? await prisma.user.update({ where: { id: userId }, data }) : user;
  if (action === 'suspend' || action === 'ban') {
    // Their courses can't be bought, so take them out of everyone's carts
    await prisma.cartItem.deleteMany({ where: { course: { instructorId: userId } } });
  }
  await logAction(admin, `user.${action}`, 'USER', user.id, `${user.name} <${user.email}>`, reason);
  return updated;
}

// ───────────────────────────── Content ─────────────────────────────

export async function setReviewHidden(admin, reviewId, hidden, reason) {
  const review = await prisma.review.findUnique({ where: { id: reviewId }, include: { course: { select: { title: true } }, user: { select: { name: true } } } });
  if (!review) throw new ApiError('Review not found', 404);
  await prisma.review.update({ where: { id: reviewId }, data: { hidden } });
  await refreshCourseRating(review.courseId);
  if (hidden) await notify(review.userId, 'Your review was hidden', `Your review of "${review.course.title}" breaks our community guidelines${reason ? `: ${reason}` : '.'}`, null);
  await logAction(admin, hidden ? 'review.hide' : 'review.unhide', 'REVIEW', review.id, `${review.user.name} on ${review.course.title}`, reason);
}

export async function removeDiscussion(admin, type, id, reason) {
  if (type === 'QUESTION') {
    const q = await prisma.question.findUnique({ where: { id } });
    if (!q) throw new ApiError('Question not found', 404);
    await prisma.question.delete({ where: { id } });
    await notify(q.userId, 'Your question was removed', `"${q.title.slice(0, 60)}" was removed${reason ? `: ${reason}` : '.'}`, null);
    await logAction(admin, 'question.remove', 'QUESTION', id, q.title, reason);
  } else if (type === 'ANSWER') {
    const a = await prisma.answer.findUnique({ where: { id } });
    if (!a) throw new ApiError('Answer not found', 404);
    await prisma.answer.delete({ where: { id } });
    await notify(a.userId, 'Your answer was removed', `An answer you posted was removed${reason ? `: ${reason}` : '.'}`, null);
    await logAction(admin, 'answer.remove', 'ANSWER', id, a.body.slice(0, 80), reason);
  } else throw new ApiError('Unknown content type', 422);
}

// ───────────────────────────── Reports ─────────────────────────────

/** Turns a report target into something an admin can read and act on. */
export async function describeTarget(type, id) {
  switch (type) {
    case 'COURSE': {
      const c = await prisma.course.findUnique({ where: { id }, select: { id: true, title: true, slug: true, status: true, instructorId: true, instructor: { select: { name: true } } } });
      return c && { name: c.title, excerpt: `by ${c.instructor.name} · ${c.status.toLowerCase()}`, link: `/admin/courses/${c.id}`, ownerId: c.instructorId, courseId: c.id };
    }
    case 'REVIEW': {
      const r = await prisma.review.findUnique({ where: { id }, include: { user: { select: { name: true } }, course: { select: { id: true, title: true } } } });
      return r && { name: `${r.rating}★ review by ${r.user.name}`, excerpt: r.comment || '(no text)', link: `/admin/courses/${r.course.id}#reviews`, ownerId: r.userId, courseId: r.course.id, hidden: r.hidden };
    }
    case 'QUESTION': {
      const q = await prisma.question.findUnique({ where: { id }, include: { user: { select: { name: true } }, course: { select: { id: true, title: true } } } });
      return q && { name: `Question by ${q.user.name}`, excerpt: `${q.title}${q.body ? ` — ${q.body}` : ''}`, link: `/admin/courses/${q.course.id}`, ownerId: q.userId, courseId: q.course.id };
    }
    case 'ANSWER': {
      const a = await prisma.answer.findUnique({ where: { id }, include: { user: { select: { name: true } }, question: { select: { courseId: true } } } });
      return a && { name: `Answer by ${a.user.name}`, excerpt: a.body, link: `/admin/courses/${a.question.courseId}`, ownerId: a.userId, courseId: a.question.courseId };
    }
    case 'USER': {
      const u = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, email: true, role: true } });
      return u && { name: u.name, excerpt: `${u.email} · ${u.role.toLowerCase()}`, link: `/admin/users/${u.id}`, ownerId: u.id };
    }
    default:
      return null;
  }
}

export const REPORT_ACTIONS = ['none', 'hide-review', 'remove-content', 'suspend-course', 'warn-user', 'suspend-user'];

/** Resolves or dismisses a report (and every other open report on the same thing), optionally acting on it. */
export async function resolveReport(admin, reportId, { status, resolution, action = 'none', reason }) {
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) throw new ApiError('Report not found', 404);
  if (report.status !== 'OPEN') throw new ApiError('This report was already handled', 400);
  if (!['RESOLVED', 'DISMISSED'].includes(status)) throw new ApiError('Status must be RESOLVED or DISMISSED', 422);

  const target = await describeTarget(report.targetType, report.targetId);
  const why = reason || resolution || `Reported for ${report.reason.toLowerCase().replace('_', ' ')}`;

  if (status === 'RESOLVED' && action !== 'none') {
    if (!target) throw new ApiError('The reported content no longer exists', 410);
    if (action === 'hide-review' && report.targetType === 'REVIEW') await setReviewHidden(admin, report.targetId, true, why);
    else if (action === 'remove-content' && ['QUESTION', 'ANSWER'].includes(report.targetType)) await removeDiscussion(admin, report.targetType, report.targetId, why);
    else if (action === 'suspend-course' && target.courseId) await moderateCourse(admin, target.courseId, 'suspend', why);
    else if (action === 'warn-user') await moderateUser(admin, target.ownerId, 'warn', { reason: why });
    else if (action === 'suspend-user') await moderateUser(admin, target.ownerId, 'suspend', { reason: why, holdPayouts: true });
    else throw new ApiError(`"${action}" doesn’t apply to a ${report.targetType.toLowerCase()} report`, 422);
  }

  const handled = await prisma.report.updateMany({
    where: { targetType: report.targetType, targetId: report.targetId, status: 'OPEN' },
    data: { status, resolution: resolution || (action !== 'none' ? `Action taken: ${action}` : null), handledById: admin.id, resolvedAt: new Date() },
  });
  await logAction(admin, `report.${status.toLowerCase()}`, 'REPORT', report.id, target?.name || report.targetType, resolution || action);
  return { handled: handled.count };
}
