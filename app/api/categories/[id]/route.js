import prisma from '@/lib/prisma';
import { route, json, readBody, requireUser } from '@/lib/api';
import { slugify } from '@/lib/utils';

// PUT /api/categories/:id (admin)
export const PUT = route(async (req, { id }) => {
  await requireUser('ADMIN');
  const { name, icon, color } = await readBody(req);
  const data = {};
  if (name) Object.assign(data, { name, slug: slugify(name) });
  if (icon) data.icon = icon;
  if (color) data.color = color;
  const category = await prisma.category.update({ where: { id }, data });
  return json({ category });
});

// DELETE /api/categories/:id (admin) — courses keep existing, category set to null
export const DELETE = route(async (req, { id }) => {
  await requireUser('ADMIN');
  await prisma.category.delete({ where: { id } });
  return json({ ok: true });
});
