import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { Plus, Activity, Trophy, Users, Shield, Radio, Clock } from 'lucide-react';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const userId = session.user.id;

  const [recentMatches, activeTournaments, playerCount, teamCount, totalMatchCount, analyticsData] = await Promise.all([
    prisma.match.findMany({
      where: { userId },
      include: {
        teamA: true, teamB: true,
        innings: { select: { totalRuns: true, totalWickets: true, totalOvers: true, inningsNumber: true, battingTeamId: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.tournament.findMany({
      where: { userId, status: { not: 'COMPLETED' } },
      include: { _count: { select: { matches: true } } },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
    prisma.player.count({ where: { userId } }),
    prisma.team.count({ where: { userId } }),
    prisma.match.count({ where: { userId } }),
    // Fetch completed matches with innings for analytics
    prisma.match.findMany({
      where: { userId, status: 'COMPLETED' },
      include: {
        innings: {
          select: { totalRuns: true, totalWickets: true, inningsNumber: true, battingTeamId: true,
            batterScores: { select: { playerId: true, runs: true, player: { select: { name: true } } } },
            bowlerScores: { select: { playerId: true, wickets: true, player: { select: { name: true } } } },
          },
        },
      },
    }),
  ]);

  // Analytics: top scorer and top wicket-taker
  const runsMap: Record<string, { name: string; runs: number }> = {};
  const wicketsMap: Record<string, { name: string; wickets: number }> = {};
  analyticsData.forEach((m) => {
    m.innings.forEach((inn) => {
      inn.batterScores.forEach((bs) => {
        if (!runsMap[bs.playerId]) runsMap[bs.playerId] = { name: bs.player.name, runs: 0 };
        runsMap[bs.playerId].runs += bs.runs;
      });
      inn.bowlerScores.forEach((bs) => {
        if (!wicketsMap[bs.playerId]) wicketsMap[bs.playerId] = { name: bs.player.name, wickets: 0 };
        wicketsMap[bs.playerId].wickets += bs.wickets;
      });
    });
  });
  const topScorer = Object.values(runsMap).sort((a, b) => b.runs - a.runs)[0];
  const topWicketTaker = Object.values(wicketsMap).sort((a, b) => b.wickets - a.wickets)[0];

  // Win rate: matches where a team tied to userId won (approximate by completed matches)
  const completedCount = analyticsData.length;
  const winRate = totalMatchCount > 0 ? Math.round((completedCount / totalMatchCount) * 100) : 0;

  const QUICK_ACTIONS = [
    { href: '/matches/new', label: 'New Match', icon: Activity, color: 'bg-cricket-green' },
    { href: '/tournaments/new', label: 'New Tournament', icon: Trophy, color: 'bg-amber-600' },
    { href: '/players/new', label: 'Add Player', icon: Users, color: 'bg-blue-600' },
    { href: '/teams/new', label: 'New Team', icon: Shield, color: 'bg-purple-600' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {session.user.name?.split(' ')[0]} 👋</h1>
        <p className="text-muted-foreground">Here&apos;s what&apos;s happening with your cricket world.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Total Matches', value: totalMatchCount },
          { label: 'Active Tournaments', value: activeTournaments.length },
          { label: 'Players', value: playerCount },
          { label: 'Teams', value: teamCount },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="text-3xl font-black text-cricket-green">{value}</div>
              <div className="text-sm text-muted-foreground">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics */}
      {(topScorer || topWicketTaker) && (
        <div>
          <h2 className="mb-3 font-semibold">Analytics</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Completed Matches</p>
                <p className="text-3xl font-black text-cricket-green">{completedCount}</p>
                <p className="text-xs text-muted-foreground mt-1">out of {totalMatchCount} total</p>
              </CardContent>
            </Card>
            {topScorer && (
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Top Scorer</p>
                  <p className="text-lg font-bold truncate">{topScorer.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{topScorer.runs} runs</p>
                </CardContent>
              </Card>
            )}
            {topWicketTaker && (
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Top Wicket-Taker</p>
                  <p className="text-lg font-bold truncate">{topWicketTaker.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{topWicketTaker.wickets} wickets</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="mb-3 font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_ACTIONS.map(({ href, label, icon: Icon, color }) => (
            <Link key={href} href={href}>
              <div className={`flex flex-col items-center gap-2 rounded-xl p-4 ${color} text-white transition-opacity hover:opacity-90 text-center`}>
                <Icon className="h-7 w-7" />
                <span className="text-sm font-medium">{label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Matches */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Recent Matches</h2>
          <Link href="/matches" className="text-sm text-cricket-green hover:underline">View all</Link>
        </div>
        {recentMatches.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <Activity className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-muted-foreground mb-3">No matches yet</p>
            <Button asChild className="bg-cricket-green hover:bg-cricket-green/90 rounded-xl">
              <Link href="/matches/new"><Plus className="mr-1.5 h-4 w-4" />New Match</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentMatches.map((match) => {
              const teamAInn = match.innings.find((i) => i.battingTeamId === match.teamAId);
              const teamBInn = match.innings.find((i) => i.battingTeamId === match.teamBId);
              const inn1 = match.innings.find((i) => i.inningsNumber === 1);
              const inn2 = match.innings.find((i) => i.inningsNumber === 2);
              const isLive = match.status === 'LIVE';
              const isCompleted = match.status === 'COMPLETED';

              let winnerName: string | undefined;
              if (isCompleted && inn1 && inn2) {
                const inn2Team = inn2.battingTeamId === match.teamAId ? match.teamA.name : match.teamB.name;
                const inn1Team = inn1.battingTeamId === match.teamAId ? match.teamA.name : match.teamB.name;
                if (inn2.totalRuns > inn1.totalRuns) winnerName = inn2Team;
                else if (inn1.totalRuns > inn2.totalRuns) winnerName = inn1Team;
              }

              return (
                <Link key={match.id} href={`/matches/${match.id}`} className="block group">
                  <div className={[
                    'relative rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
                    isLive ? 'border-red-500/50 bg-gradient-to-br from-red-950/30 to-background' : 'border-border/60 bg-card',
                  ].join(' ')}>
                    {isLive && <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-red-500 via-orange-400 to-red-500 animate-pulse" />}
                    <div className="p-4">
                      {/* Header row */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 flex-wrap font-bold text-sm">
                          <span>{match.teamA.name}</span>
                          <span className="text-xs text-muted-foreground font-normal">vs</span>
                          <span>{match.teamB.name}</span>
                        </div>
                        {isLive && (
                          <span className="flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white animate-pulse shrink-0">
                            <Radio className="h-3 w-3" /> LIVE
                          </span>
                        )}
                        {isCompleted && (
                          <span className="flex items-center gap-1 rounded-full bg-green-700/80 px-2 py-0.5 text-xs font-semibold text-white shrink-0">
                            <Trophy className="h-3 w-3" /> Done
                          </span>
                        )}
                        {!isLive && !isCompleted && (
                          <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground shrink-0">
                            <Clock className="h-3 w-3" /> Upcoming
                          </span>
                        )}
                      </div>

                      {/* Score mini-cards */}
                      {(teamAInn || teamBInn) && (
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { team: match.teamA, inn: teamAInn, color: 'blue' },
                            { team: match.teamB, inn: teamBInn, color: 'rose' },
                          ].map(({ team, inn, color }) => (
                            <div key={team.id} className={[
                              'rounded-xl px-3 py-2',
                              color === 'blue' ? 'bg-blue-950/40 border border-blue-500/20' : 'bg-rose-950/40 border border-rose-500/20',
                            ].join(' ')}>
                              <p className={`text-xs font-medium truncate mb-0.5 ${color === 'blue' ? 'text-blue-400' : 'text-rose-400'}`}>{team.name}</p>
                              {inn ? (
                                <p className="text-base font-black leading-none">
                                  {inn.totalRuns}<span className="text-sm font-semibold text-muted-foreground">/{inn.totalWickets}</span>
                                  <span className="text-xs text-muted-foreground ml-1">({Math.floor(inn.totalOvers)}.{Math.round((inn.totalOvers % 1) * 6)} ov)</span>
                                </p>
                              ) : (
                                <p className="text-xs text-muted-foreground">Yet to bat</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatDate(match.createdAt)}</span>
                        {winnerName && <span className="text-yellow-400 font-semibold">🏆 {winnerName} won</span>}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Tournaments */}
      {activeTournaments.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Active Tournaments</h2>
            <Link href="/tournaments" className="text-sm text-cricket-green hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {activeTournaments.map((t) => (
              <Link key={t.id} href={`/tournaments/${t.id}`}>
                <Card className="hover:border-cricket-green/40 transition-colors">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-semibold">{t.name}</p>
                      <p className="text-sm text-muted-foreground">{t.format} · {t._count.matches} matches</p>
                    </div>
                    <Trophy className="h-5 w-5 text-amber-500" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
