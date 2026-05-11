import { adminAuth } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate, getInitials } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';

export default async function AdminTeamDetailPage({ params }: { params: { id: string } }) {
  const session = await adminAuth();
  if (!(session as any)?.admin) redirect('/admin/login');

  const team = await prisma.team.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { name: true, email: true } },
      captainUser: { select: { name: true, email: true } },
      players: {
        include: { player: true },
      },
      matchesAsTeamA: {
        include: { teamB: true, innings: { select: { totalRuns: true, totalWickets: true, inningsNumber: true, battingTeamId: true } } },
        orderBy: { createdAt: 'desc' },
        take: 15,
      },
      matchesAsTeamB: {
        include: { teamA: true, innings: { select: { totalRuns: true, totalWickets: true, inningsNumber: true, battingTeamId: true } } },
        orderBy: { createdAt: 'desc' },
        take: 15,
      },
    },
  });

  if (!team) notFound();

  const allMatches = [
    ...team.matchesAsTeamA.map((m) => ({ ...m, opponent: m.teamB, isTeamA: true })),
    ...team.matchesAsTeamB.map((m) => ({ ...m, opponent: m.teamA, isTeamA: false })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 15);

  const completed = allMatches.filter((m) => m.status === 'COMPLETED');
  const won = completed.filter((m) => {
    const inn1 = m.innings.find((i) => i.inningsNumber === 1);
    const inn2 = m.innings.find((i) => i.inningsNumber === 2);
    if (!inn1 || !inn2) return false;
    const myRuns = inn1.battingTeamId === team.id ? inn1.totalRuns : inn2.totalRuns;
    const oppRuns = inn1.battingTeamId !== team.id ? inn1.totalRuns : inn2.totalRuns;
    return myRuns > oppRuns;
  }).length;

  const statusColor: Record<string, string> = {
    LIVE: 'bg-red-500/15 text-red-400',
    COMPLETED: 'bg-cricket-green-500/15 text-cricket-green',
    UPCOMING: 'bg-amber-500/15 text-amber-400',
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <Link href="/admin/teams" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Teams
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white shrink-0"
          style={{ backgroundColor: team.color }}
        >
          {team.name.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{team.name}</h1>
          {team.homeGround && <p className="text-sm text-muted-foreground">{team.homeGround}</p>}
          <p className="text-xs text-muted-foreground mt-0.5">Owner: {team.user.name ?? team.user.email}</p>
          {team.captainUser && (
            <p className="text-xs text-muted-foreground">Captain: {team.captainUser.name ?? team.captainUser.email}</p>
          )}
          <p className="text-xs text-muted-foreground">Created: {formatDate(team.createdAt.toISOString())}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Matches', value: completed.length },
          { label: 'Won', value: won },
          { label: 'Lost', value: completed.length - won },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-black text-cricket-green">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Squad */}
      <div>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
          Squad ({team.players.length})
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {team.players.map(({ player }) => (
            <Link key={player.id} href={`/admin/players/${player.id}`} className="flex items-center gap-2.5 rounded-lg border border-border/40 px-3 py-2 hover:bg-muted/30 hover:border-border transition-colors">
              <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shrink-0"
                style={{ backgroundColor: team.color + '33', color: team.color }}>
                {getInitials(player.name)}
              </div>
              <span className="text-sm font-medium truncate">{player.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Matches */}
      {allMatches.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Recent Matches</h2>
          <div className="space-y-2">
            {allMatches.map((m) => {
              const inn1 = m.innings.find((i) => i.inningsNumber === 1);
              const inn2 = m.innings.find((i) => i.inningsNumber === 2);
              const myRuns = inn1 && inn2 ? (inn1.battingTeamId === team.id ? inn1 : inn2) : null;
              const oppRuns = inn1 && inn2 ? (inn1.battingTeamId !== team.id ? inn1 : inn2) : null;
              return (
                <Link key={m.id} href={`/admin/matches/${m.id}`} className="flex items-center justify-between rounded-lg border border-border/40 px-4 py-2.5 hover:bg-muted/30 hover:border-border transition-colors">
                  <div>
                    <p className="text-sm font-medium">vs <span style={{ color: m.opponent.color }}>{m.opponent.name}</span></p>
                    <p className="text-xs text-muted-foreground">{formatDate(m.createdAt.toISOString())}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {myRuns && oppRuns && (
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {myRuns.totalRuns}/{myRuns.totalWickets} — {oppRuns.totalRuns}/{oppRuns.totalWickets}
                      </span>
                    )}
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusColor[m.status] ?? ''}`}>
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
