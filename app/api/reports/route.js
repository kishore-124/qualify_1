import prisma from '@/lib/prisma';
import { route, json, readBody, requireUser, ApiError } from '@/lib/api';
import { describeTarget } from '@/lib/moderation';

const TARGETS = ['COURSE', 'REVIEW', 'QUESTION', 'ANSWER', 'USER'];
const REASONS = ['SPAM', 'INAPPROPRIATE', 'COPYRIGHT', 'MISLEADING', 'SCAM', 'LOW_QUALITY', 'OTHER'];

// POST /api/reports  { targetType, targetId, reason, details? } — flag something for the moderation team
export const POST = route(async (req) => {
  const user = await requireUser();
  const { targetType, targetId, reason, details } = await readBody(req);
  if (!TARGETS.includes(targetType)) throw new ApiError('Choose what you are reporting', 422);
  if (!REASONS.includes(reason)) throw new ApiError('Choose a reason', 422);
  if (reason === 'OTHER' && !details?.trim()) throw new ApiError('Tell us what’s wrong', 422);

  const target = await describeTarget(targetType, targetId);
  if (!target) throw new ApiError('That content no longer exists', 404);
  if (target.ownerId === user.id) throw new ApiError('You can’t report your own content', 400);

  const existing = await prisma.report.findFirst({ where: { reporterId: user.id, targetType, targetId, status: 'OPEN' } });
  if (existing) return json({ report: existing, duplicate: true });

  const report = await prisma.report.create({
    data: { reporterId: user.id, targetType, targetId, reason, details: details?.trim().slice(0, 2000) || null },
  });
  return json({ report }, 201);
});
