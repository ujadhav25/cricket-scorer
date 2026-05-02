import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { AdminSearch } from '../AdminSearch';

export default async function AdminTeamsPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') redirect('/dashboard');

  const page = Math.max(1, Number(searchParams.page ?? 1));
  const search = searchParams.q ?? '';
  const limit = 20;

  const where = search ? { name: { contains: search, mode: 'insensitive' as const } } : {};

  const [teams, total] = await Promise.all([
    prisma.team.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, name: true, color: true, homeGround: true, createdAt: true,
        user: { select: { name: true, email: true } },
        _count: { select: { players: true, matchesAsTeamA: true, matchesAsTeamB: true } },
      },
    }),
    prisma.team.count({ where }),
  ]);

  const pages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Teams</h1>
          <p className="text-sm text-muted-foreground">{total.toLocaleString()} total</p>
        </div>
        <AdminSearch placeholder="Search team name…" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 text-xs text-muted-foreground">
                  <th className="text-left px-4 py-2.5 font-medium">Team</th>
                  <th className="text-left px-4 py-2.5 font-medium">Home Ground</th>
                  <th className="text-right px-4 py-2.5 font-medium">Players</th>
                  <th className="text-right px-4 py-2.5 font-medium">Matches</th>
                  <th className="text-left px-4 py-2.5 font-medium">Owner</th>
                  <th className="text-left px-4 py-2.5 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {teams.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full shrink-0" style={{ background: t.color }} />
                        <span className="font-medium">{t.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{t.homeGround ?? '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{t._count.players}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{t._count.matchesAsTeamA + t._count.matchesAsTeamB}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{t.user.name ?? t.user.email}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(t.createdAt.toISOString())}</td>
                  </tr>
                ))}
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
              <a href={`/admin/teams?page=${page - 1}${search ? `&q=${encodeURIComponent(search)}` : ''}`}
                className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted/30 transition-colors">Previous</a>
            )}
            {page < pages && (
              <a href={`/admin/teams?page=${page + 1}${search ? `&q=${encodeURIComponent(search)}` : ''}`}
                className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted/30 transition-colors">Next</a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
