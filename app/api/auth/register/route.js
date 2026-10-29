import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { route, json, readBody, ApiError } from '@/lib/api';
import { setAuthCookie, publicUserSelect } from '@/lib/auth';
import { notify } from '@/lib/course';

// POST /api/auth/register  { name, email, password, role?: 'STUDENT' | 'INSTRUCTOR' }
export const POST = route(async (req) => {
  const { name, email, password, role } = await readBody(req);
  if (!name?.trim() || !email?.trim() || !password) throw new ApiError('Name, email and password are required', 422);
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new ApiError('Please enter a valid email address', 422);
  if (password.length < 6) throw new ApiError('Password must be at least 6 characters', 422);

  const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (exists) throw new ApiError('An account with this email already exists', 409);

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: await bcrypt.hash(password, 10),
      role: role === 'INSTRUCTOR' ? 'INSTRUCTOR' : 'STUDENT',
    },
    select: publicUserSelect,
  });
  await notify(user.id, `Welcome to Qualify, ${user.name.split(' ')[0]}! 👋`, 'Explore thousands of courses and start learning today.', '/courses');

  return setAuthCookie(json({ user }, 201), user);
});
