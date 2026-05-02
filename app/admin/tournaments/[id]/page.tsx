import { adminAuth } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';

const matchStatusColor: Record<string, string> = {
  LIVE: 'bg-red-500/15 text-red-400',
  COMPLETED: 'bg-cricket-green-500/15 text-cricket-green',
  UPCOMING: 'bg-amber-500/15 text-amber-400',
};

const tournamentStatusColor: Record<string, string> = {
  UPCOMING: 'bg-amber-500/15 text-amber-400',
  ONGOING: 'bg-blue-500/15 text-blue-400',
  COMPLETED: 'bg-cricket-green-500/15 text-cricket-green',
};

export default async function AdminTournamentDetailPage({ params }: { params: { id: string } }) {
  const session = await adminAuth();
  if (!(session as any)?.admin) redirect('/admin/login');

  const tournament = await prisma.tournament.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { name: true, email: true } },
      teams: { include: { team: true }, orderBy: { createdAt: 'asc' } },
      matches: {
        include: {
          teamA: true,
          teamB: true,
          innings: {
            select: { totalRuns: true, totalWickets: true, inningsNumber: true, battingTeamId: true, totalOvers: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!tournament) notFound();

  const completedMatches = tournament.matches.filter((m) => m.status === 'COMPLETED');

  // Points table
  const table: Record<string, { name: string; color: string; played: number; won: number; lost: number; tied: number; points: number }> = {};
  tournament.teams.forEach(({ team }) => {
    table[team.id] = { name: team.name, color: team.color, played: 0, won: 0, lost: 0, tied: 0, points: 0 };
  });

  completedMatches.forEach((m) => {
    const inn1 = m.innings.find((i) => i.inningsNumber === 1);
    const inn2 = m.innings.find((i) => i.inningsNumber === 2);
    const ta = table[m.teamAId];
    const tb = table[m.teamBId];
    if (!ta || !tb || !inn1 || !inn2) return;
    ta.played++; tb.played++;
    const aRuns = inn1.battingTeamId === m.teamAId ? inn1.totalRuns : inn2.totalRuns;
    const bRuns = inn1.battingTeamId === m.teamBId ? inn1.totalRuns : inn2.totalRuns;
    if (aRuns > bRuns) { ta.won++; ta.points += 2; tb.lost++; }
    else if (bRuns > aRuns) { tb.won++; tb.points += 2; ta.lost++; }
    else { ta.tied++; ta.points++; tb.tied++; tb.points++; }
  });

  const pointsTable = Object.values(table).sort((a, b) => b.points - a.points || b.won - a.won);
  const isBilateral = tournament.format === 'BILATERAL';

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <Link href="/admin/tournaments" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Tournaments
      </Link>

      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">{tournament.name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tournamentStatusColor[tournament.status] ?? ''}`}>
                {tournament.status}
              </span>
              <span className="text-xs text-muted-foreground">{tournament.format}</span>
              {tournament.defaultOvers && <span className="text-xs text-muted-foreground">{tournament.defaultOvers} overs</span>}
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>Organizer: {tournament.user.name ?? tournament.user.email}</p>
            <p>Created: {formatDate(tournament.createdAt.toISOString())}</p>
          </div>
        </div>
        {tournament.description && (
          <p className="mt-2 text-sm text-muted-foreground">{tournament.description}</p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Teams', value: tournament.teams.length },
          { label: 'Matches', value: tournament.matches.length },
          { label: 'Completed', value: completedMatches.length },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-black text-cricket-green">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Points Table (for non-bilateral) */}
      {!isBilateral && pointsTable.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Points Table</h2>
          <div className="rounded-xl border border-border/40 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 text-xs text-muted-foreground bg-muted/20">
                  <th className="text-left px-4 py-2.5 font-medium">Team</th>
                  <th className="text-right px-3 py-2.5 font-medium">P</th>
                  <th className="text-right px-3 py-2.5 font-medium">W</th>
                  <th className="text-right px-3 py-2.5 font-medium">L</th>
                  <th className="text-right px-3 py-2.5 font-medium">T</th>
                  <th className="text-right px-4 py-2.5 font-medium">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {pointsTable.map((row, i) => (
                  <tr key={row.name} className={i === 0 && row.played > 0 ? 'bg-cricket-green/5' : ''}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full shrink-0" style={{ background: row.color }} />
                        <span className="font-medium">{row.name}</span>
                      </div>
                    </td>
                    <td className="text-right px-3 py-2.5 tabular-nums text-muted-foreground">{row.played}</td>
                    <td className="text-right px-3 py-2.5 tabular-nums text-cricket-green font-medium">{row.won}</td>
                    <td className="text-right px-3 py-2.5 tabular-nums text-red-400">{row.lost}</td>
                    <td className="text-right px-3 py-2.5 tabular-nums text-muted-foreground">{row.tied}</td>
                    <td className="text-right px-4 py-2.5 tabular-nums font-bold">{row.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Teams */}
      <div>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
          Teams ({tournament.teams.length})
        </h2>
        <div className="flex flex-wrap gap-2">
          {tournament.teams.map(({ team }) => (
            <Link key={team.id} href={`/admin/teams/${team.id}`}
              className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border border-border/40 hover:bg-muted/30 hover:border-border transition-colors font-medium">
              <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: team.color }} />
              {team.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Matches */}
      {tournament.matches.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            Matches ({tournament.matches.length})
          </h2>
          <div className="space-y-2">
            {tournament.matches.map((m) => {
              const inn1 = m.innings.find((i) => i.inningsNumber === 1);
              const inn2 = m.innings.find((i) => i.inningsNumber === 2);
              return (
                <Link key={m.id} href={`/admin/matches/${m.id}`}
                  className="flex items-center justify-between rounded-lg border border-border/40 px-4 py-2.5 hover:bg-muted/30 hover:border-border transition-colors">
                  <div>
                    <p className="text-sm font-medium">
                      <span style={{ color: m.teamA.color }}>{m.teamA.name}</span>
                      <span className="text-muted-foreground mx-1.5 text-xs">vs</span>
                      <span style={{ color: m.teamB.color }}>{m.teamB.name}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(m.createdAt.toISOString())}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {inn1 && inn2 && (
                      <span className="text-xs text-muted-foreground tabular-nums hidden sm:block">
                        {inn1.totalRuns}/{inn1.totalWickets} — {inn2.totalRuns}/{inn2.totalWickets}
                      </span>
                    )}
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${matchStatusColor[m.status] ?? ''}`}>
                      {m.status}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
