import { route, json, readBody, requireUser } from '@/lib/api';
import { resolveReport } from '@/lib/moderation';

// PATCH /api/admin/reports/:id  { status: 'RESOLVED'|'DISMISSED', resolution?, action?, reason? }
// action: none | hide-review | remove-content | suspend-course | warn-user | suspend-user
export const PATCH = route(async (req, { id }) => {
  const admin = await requireUser('ADMIN');
  const body = await readBody(req);
  return json(await resolveReport(admin, id, body));
});
