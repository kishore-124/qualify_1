import { json } from '@/lib/api';
import { clearAuthCookie } from '@/lib/auth';

// POST /api/auth/logout
export async function POST() {
  return clearAuthCookie(json({ ok: true }));
}
