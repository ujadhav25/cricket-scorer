import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { AdminSearch } from '../AdminSearch';

const statusColor: Record<string, string> = {
  UPCOMING: 'bg-amber-500/15 text-amber-400',
  ONGOING: 'bg-blue-500/15 text-blue-400',
  COMPLETED: 'bg-cricket-green-500/15 text-cricket-green',
};

export default async function AdminTournamentsPage({
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

  const [tournaments, total] = await Promise.all([
    prisma.tournament.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, name: true, format: true, status: true, createdAt: true, startDate: true, endDate: true,
        user: { select: { name: true, email: true } },
        _count: { select: { teams: true, matches: true } },
      },
    }),
    prisma.tournament.count({ where }),
  ]);

  const pages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Tournaments</h1>
          <p className="text-sm text-muted-foreground">{total.toLocaleString()} total</p>
        </div>
        <AdminSearch placeholder="Search tournament name…" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 text-xs text-muted-foreground">
                  <th className="text-left px-4 py-2.5 font-medium">Tournament</th>
                  <th className="text-left px-4 py-2.5 font-medium">Format</th>
                  <th className="text-left px-4 py-2.5 font-medium">Status</th>
                  <th className="text-right px-4 py-2.5 font-medium">Teams</th>
                  <th className="text-right px-4 py-2.5 font-medium">Matches</th>
                  <th className="text-left px-4 py-2.5 font-medium">Organizer</th>
                  <th className="text-left px-4 py-2.5 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {tournaments.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/tournaments/${t.id}`} className="font-medium hover:underline">{t.name}</Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{t.format}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusColor[t.status] ?? ''}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{t._count.teams}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{t._count.matches}</td>
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
              <a href={`/admin/tournaments?page=${page - 1}${search ? `&q=${encodeURIComponent(search)}` : ''}`}
                className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted/30 transition-colors">Previous</a>
            )}
            {page < pages && (
              <a href={`/admin/tournaments?page=${page + 1}${search ? `&q=${encodeURIComponent(search)}` : ''}`}
                className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted/30 transition-colors">Next</a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
