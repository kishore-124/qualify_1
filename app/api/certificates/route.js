import prisma from '@/lib/prisma';
import { route, json, requireUser } from '@/lib/api';

// GET /api/certificates — my certificates
export const GET = route(async () => {
  const user = await requireUser();
  const certificates = await prisma.certificate.findMany({
    where: { userId: user.id },
    orderBy: { issuedAt: 'desc' },
    include: { course: { select: { id: true, title: true, slug: true, thumbnail: true, instructor: { select: { name: true } } } } },
  });
  return json({ certificates });
});
