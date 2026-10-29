import prisma from '@/lib/prisma';
import { route, json, requireUser } from '@/lib/api';
import { describeTarget } from '@/lib/moderation';

// GET /api/admin/reports?status=OPEN|RESOLVED|DISMISSED&type= — reports grouped by the thing reported
export const GET = route(async (req) => {
  await requireUser('ADMIN');
  const sp = new URL(req.url).searchParams;
  const status = sp.get('status') || 'OPEN';
  const type = sp.get('type');
  const reports = await prisma.report.findMany({
    where: { status, ...(type ? { targetType: type } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      reporter: { select: { id: true, name: true, email: true } },
      handledBy: { select: { name: true } },
    },
  });

  // Group by target so 5 reports about one course show up as one item
  const groups = new Map();
  for (const r of reports) {
    const key = `${r.targetType}:${r.targetId}`;
    if (!groups.has(key)) groups.set(key, { key, targetType: r.targetType, targetId: r.targetId, reports: [] });
    groups.get(key).reports.push(r);
  }
  const items = await Promise.all(
    [...groups.values()].map(async (g) => ({
      ...g,
      target: await describeTarget(g.targetType, g.targetId),
      reasons: [...new Set(g.reports.map((r) => r.reason))],
      latest: g.reports[0].createdAt,
    }))
  );
  items.sort((a, b) => b.reports.length - a.reports.length || new Date(b.latest) - new Date(a.latest));

  const counts = await prisma.report.groupBy({ by: ['status'], _count: { _all: true } });
  return json({ items, counts: Object.fromEntries(counts.map((c) => [c.status, c._count._all])) });
});
