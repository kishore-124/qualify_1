import prisma from '@/lib/prisma';
import { route, json, ApiError } from '@/lib/api';

// GET /api/certificates/:id — public verification endpoint (by id or serial)
export const GET = route(async (req, { id }) => {
  const certificate = await prisma.certificate.findFirst({
    where: { OR: [{ id }, { serial: id }] },
    include: {
      user: { select: { name: true } },
      course: { select: { title: true, slug: true, instructor: { select: { name: true } } } },
    },
  });
  if (!certificate) throw new ApiError('Certificate not found', 404);
  return json({ certificate, valid: true });
});
