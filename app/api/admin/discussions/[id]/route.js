import { route, json, requireUser } from '@/lib/api';
import { removeDiscussion } from '@/lib/moderation';

// DELETE /api/admin/discussions/:id?type=QUESTION|ANSWER&reason= — remove a Q&A post
export const DELETE = route(async (req, { id }) => {
  const admin = await requireUser('ADMIN');
  const sp = new URL(req.url).searchParams;
  await removeDiscussion(admin, sp.get('type') || 'QUESTION', id, sp.get('reason'));
  return json({ ok: true });
});
