import prisma from '@/lib/prisma';
import { route, json, requireUser } from '@/lib/api';
import { publicUserSelect, setAuthCookie } from '@/lib/auth';
import { notify } from '@/lib/course';

// POST /api/profile/become-instructor
export const POST = route(async () => {
  const me = await requireUser();
  if (me.role !== 'STUDENT') return json({ user: me });
  const user = await prisma.user.update({
    where: { id: me.id },
    data: { role: 'INSTRUCTOR' },
    select: publicUserSelect,
  });
  await notify(user.id, 'You are now an instructor 🎓', 'Create your first course and share your knowledge.', '/instructor/courses/new');
  return setAuthCookie(json({ user }), user);
});
