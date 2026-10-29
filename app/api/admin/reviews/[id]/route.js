import { route, json, readBody, requireUser } from '@/lib/api';
import { setReviewHidden } from '@/lib/moderation';

// PATCH /api/admin/reviews/:id  { hidden: boolean, reason? } — hide or restore a review
export const PATCH = route(async (req, { id }) => {
  const admin = await requireUser('ADMIN');
  const { hidden, reason } = await readBody(req);
  await setReviewHidden(admin, id, !!hidden, reason);
  return json({ ok: true, hidden: !!hidden });
});
