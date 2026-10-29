import prisma from '@/lib/prisma';
import { route, json, readBody, requireUser, ApiError } from '@/lib/api';
import { slugify } from '@/lib/utils';

// GET /api/categories — all categories with published course counts
export const GET = route(async () => {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { courses: { where: { status: 'PUBLISHED', instructor: { status: 'ACTIVE' } } } } } },
  });
  return json({ categories });
});

// POST /api/categories (admin)  { name, icon?, color? }
export const POST = route(async (req) => {
  await requireUser('ADMIN');
  const { name, icon, color } = await readBody(req);
  if (!name?.trim()) throw new ApiError('Category name is required', 422);
  const category = await prisma.category.create({
    data: { name: name.trim(), slug: slugify(name), icon: icon || 'bi-grid', color: color || '#2b3fe0' },
  });
  return json({ category }, 201);
});
