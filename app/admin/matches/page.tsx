import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { AdminSearch } from '../AdminSearch';

const STATUS_OPTIONS = ['', 'LIVE', 'COMPLETED', 'UPCOMING'];

const statusColor: Record<string, string> = {
  LIVE: 'bg-red-500/15 text-red-400',
  COMPLETED: 'bg-cricket-green-500/15 text-cricket-green',
  UPCOMING: 'bg-amber-500/15 text-amber-400',
};

export default async function AdminMatchesPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string; status?: string };
}) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') redirect('/dashboard');

  const page = Math.max(1, Number(searchParams.page ?? 1));
  const search = searchParams.q ?? '';
  const statusFilter = searchParams.status ?? '';
  const limit = 20;

  const where: any = {};
  if (search) where.OR = [
    { teamA: { name: { contains: search, mode: 'insensitive' } } },
    { teamB: { name: { contains: search, mode: 'insensitive' } } },
    { venue: { contains: search, mode: 'insensitive' } },
  ];
  if (statusFilter) where.status = statusFilter;

  const [matches, total] = await Promise.all([
    prisma.match.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, status: true, overs: true, venue: true, createdAt: true, matchType: true,
        teamA: { select: { name: true, color: true } },
        teamB: { select: { name: true, color: true } },
        user: { select: { name: true, email: true } },
        innings: {
          select: { totalRuns: true, totalWickets: true, totalOvers: true, inningsNumber: true, battingTeamId: true, isCompleted: true },
          orderBy: { inningsNumber: 'asc' },
        },
      },
    }),
    prisma.match.count({ where }),
  ]);

  const pages = Math.ceil(total / limit);

  function buildHref(extra: Record<string, string>) {
    const p = new URLSearchParams();
    if (search) p.set('q', search);
    if (statusFilter) p.set('status', statusFilter);
    p.set('page', '1');
    Object.entries(extra).forEach(([k, v]) => v ? p.set(k, v) : p.delete(k));
    return `/admin/matches?${p.toString()}`;
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Matches</h1>
          <p className="text-sm text-muted-foreground">{total.toLocaleString()} total</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status filter */}
          <div className="flex gap-1">
            {STATUS_OPTIONS.map((s) => (
              <Link
                key={s || 'all'}
                href={buildHref({ status: s })}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  statusFilter === s
                    ? 'bg-cricket-green-500/20 border-cricket-green/40 text-cricket-green'
                    : 'border-border/30 text-muted-foreground hover:text-foreground'
                }`}
              >
                {s || 'All'}
              </Link>
            ))}
          </div>
          <AdminSearch placeholder="Search teams or venue…" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 text-xs text-muted-foreground">
                  <th className="text-left px-4 py-2.5 font-medium">Match</th>
                  <th className="text-left px-4 py-2.5 font-medium">Score</th>
                  <th className="text-left px-4 py-2.5 font-medium">Status</th>
                  <th className="text-left px-4 py-2.5 font-medium">Organizer</th>
                  <th className="text-left px-4 py-2.5 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {matches.map((m) => {
                  const inn1 = m.innings.find((i) => i.inningsNumber === 1);
                  const inn2 = m.innings.find((i) => i.inningsNumber === 2);
                  return (
                    <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/matches/${m.id}`} className="hover:underline font-medium">
                          <span style={{ color: m.teamA.color }}>{m.teamA.name}</span>
                          <span className="text-muted-foreground mx-1 text-xs">vs</span>
                          <span style={{ color: m.teamB.color }}>{m.teamB.name}</span>
                        </Link>
                        <p className="text-xs text-muted-foreground">{m.overs} ov{m.venue ? ` · ${m.venue}` : ''}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {inn1 ? (
                          <span>{inn1.totalRuns}/{inn1.totalWickets}</span>
                        ) : '—'}
                        {inn2 ? (
                          <span className="ml-1">· {inn2.totalRuns}/{inn2.totalWickets}</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusColor[m.status] ?? ''}`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{m.user.name ?? m.user.email}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(m.createdAt.toISOString())}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {page} of {pages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <a href={buildHref({ page: String(page - 1) })} className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted/30 transition-colors">Previous</a>
            )}
            {page < pages && (
              <a href={buildHref({ page: String(page + 1) })} className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted/30 transition-colors">Next</a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
