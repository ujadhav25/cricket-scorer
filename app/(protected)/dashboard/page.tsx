import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { Plus, Activity, Trophy, Users, Shield, Radio, Clock, TrendingUp, Target, ArrowRight, User, Star } from 'lucide-react';
import { getViewMode } from '@/lib/view-mode';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const userId = session.user.id;

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  const player = await prisma.player.findFirst({
    where: { userId },
    select: { id: true, phone: true },
    orderBy: { createdAt: 'asc' },
  });

  // If profile is incomplete, the layout's <ClientNavigate> will redirect client-side.
  // Here, just short-circuit to avoid rendering content before navigation fires.
  if (!player?.phone || player.phone.trim() === '') {
    return null;
  }

  const effectiveView = getViewMode();

  if (effectiveView === 'player') {
    return <PlayerDashboard userId={userId} playerId={player?.id ?? null} name={currentUser?.name ?? session.user.name ?? null} />;
  }

  // ─── Organizer Dashboard ──────────────────────────────────────────────────

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

  const completedCount = analyticsData.length;

  const QUICK_ACTIONS = [
    { href: '/matches/new', label: 'New Match', icon: Activity, gradient: 'from-cricket-green-500 to-emerald-600' },
    { href: '/tournaments/new', label: 'New Tournament', icon: Trophy, gradient: 'from-cricket-amber-500 to-orange-600' },
    { href: '/players/new', label: 'Add Player', icon: Users, gradient: 'from-blue-500 to-indigo-600' },
    { href: '/teams/new', label: 'New Team', icon: Shield, gradient: 'from-purple-500 to-violet-600' },
  ];

  const STATS = [
    { label: 'Total Matches', value: totalMatchCount, icon: Activity, color: 'text-cricket-green' },
    { label: 'Tournaments', value: activeTournaments.length, icon: Trophy, color: 'text-cricket-amber' },
    { label: 'Players', value: playerCount, icon: Users, color: 'text-blue-400' },
    { label: 'Teams', value: teamCount, icon: Shield, color: 'text-purple-400' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Hey, {session.user.name?.split(' ')[0]} <span className="inline-block animate-bounce-subtle">👋</span>
          </h1>
          <p className="mt-1 text-muted-foreground">Here&apos;s your cricket overview</p>
        </div>
        <Button asChild>
          <Link href="/matches/new" className="gap-2">
            <Plus className="h-4 w-4" /> New Match
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STATS.map(({ label, value, icon: Icon, color }, i) => (
          <Card key={label} className="group hover:border-border/60 hover:shadow-lg transition-all duration-300" style={{ animationDelay: `${i * 100}ms` }}>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`rounded-xl bg-white/[0.04] p-2.5 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="text-3xl sm:text-4xl font-black tracking-tight">{value}</div>
              <div className="text-xs text-muted-foreground mt-1 font-medium">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics Row */}
      {(topScorer || topWicketTaker) && (
        <div>
          <h2 className="mb-4 text-lg font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-cricket-green" /> Analytics
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card className="gradient-border">
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Completed</p>
                <p className="text-4xl font-black text-gradient">{completedCount}</p>
                <p className="text-xs text-muted-foreground mt-1">of {totalMatchCount} matches</p>
              </CardContent>
            </Card>
            {topScorer && (
              <Card className="group hover:glow-green transition-all duration-300">
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Top Scorer</p>
                  <p className="text-lg font-bold truncate">{topScorer.name}</p>
                  <p className="text-sm text-cricket-green font-semibold mt-0.5">{topScorer.runs} runs</p>
                </CardContent>
              </Card>
            )}
            {topWicketTaker && (
              <Card className="group hover:glow-amber transition-all duration-300">
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Top Wicket-Taker</p>
                  <p className="text-lg font-bold truncate">{topWicketTaker.name}</p>
                  <p className="text-sm text-cricket-amber font-semibold mt-0.5">{topWicketTaker.wickets} wickets</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-bold flex items-center gap-2">
          <Target className="h-5 w-5 text-cricket-amber" /> Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_ACTIONS.map(({ href, label, icon: Icon, gradient }) => (
            <Link key={href} href={href} className="group">
              <div className={`relative overflow-hidden flex flex-col items-center gap-3 rounded-2xl bg-gradient-to-br ${gradient} p-5 text-white transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]`}>
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
                <Icon className="h-7 w-7 relative z-10" />
                <span className="text-sm font-semibold relative z-10">{label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Matches */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-400" /> Recent Matches
          </h2>
          <Link href="/matches" className="text-sm text-cricket-green hover:underline font-medium flex items-center gap-1">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {recentMatches.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-12">
              <div className="rounded-2xl bg-white/[0.04] p-4 mb-4">
                <Activity className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="text-muted-foreground mb-4">No matches yet</p>
              <Button asChild>
                <Link href="/matches/new"><Plus className="mr-1.5 h-4 w-4" />Start Your First Match</Link>
              </Button>
            </CardContent>
          </Card>
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
                  <Card className={[
                    'overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5',
                    isLive ? 'border-red-500/30 glow-green' : 'hover:border-border/60',
                  ].join(' ')}>
                    {isLive && <div className="h-0.5 bg-gradient-to-r from-red-500 via-orange-400 to-red-500 animate-pulse" />}
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 flex-wrap font-bold text-sm">
                          <span>{match.teamA.name}</span>
                          <span className="text-xs text-muted-foreground/60 font-normal">vs</span>
                          <span>{match.teamB.name}</span>
                        </div>
                        {isLive && (
                          <span className="flex items-center gap-1.5 rounded-full bg-red-500/20 border border-red-500/30 px-2.5 py-1 text-xs font-bold text-red-400 shrink-0">
                            <Radio className="h-3 w-3 animate-pulse" /> LIVE
                          </span>
                        )}
                        {isCompleted && (
                          <span className="flex items-center gap-1 rounded-full bg-cricket-green-500/10 border border-cricket-green-500/20 px-2.5 py-1 text-xs font-semibold text-cricket-green shrink-0">
                            <Trophy className="h-3 w-3" /> Done
                          </span>
                        )}
                        {!isLive && !isCompleted && (
                          <span className="flex items-center gap-1 rounded-full bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground shrink-0">
                            <Clock className="h-3 w-3" /> Upcoming
                          </span>
                        )}
                      </div>

                      {(teamAInn || teamBInn) && (
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { team: match.teamA, inn: teamAInn, color: 'blue' },
                            { team: match.teamB, inn: teamBInn, color: 'rose' },
                          ].map(({ team, inn, color }) => (
                            <div key={team.id} className={[
                              'rounded-xl px-3 py-2.5',
                              color === 'blue' ? 'bg-blue-500/[0.06] border border-blue-500/10' : 'bg-rose-500/[0.06] border border-rose-500/10',
                            ].join(' ')}>
                              <p className={`text-xs font-medium truncate mb-1 ${color === 'blue' ? 'text-blue-400' : 'text-rose-400'}`}>{team.name}</p>
                              {inn ? (
                                <p className="text-base font-black leading-none">
                                  {inn.totalRuns}<span className="text-sm font-semibold text-muted-foreground">/{inn.totalWickets}</span>
                                  <span className="text-xs text-muted-foreground/60 ml-1">({Math.floor(inn.totalOvers)}.{Math.round((inn.totalOvers % 1) * 6)})</span>
                                </p>
                              ) : (
                                <p className="text-xs text-muted-foreground/60">Yet to bat</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground/60">
                        <span>{formatDate(match.createdAt)}</span>
                        {winnerName && <span className="text-cricket-amber font-semibold">🏆 {winnerName} won</span>}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Tournaments */}
      {activeTournaments.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-cricket-amber" /> Active Tournaments
            </h2>
            <Link href="/tournaments" className="text-sm text-cricket-green hover:underline font-medium flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {activeTournaments.map((t) => (
              <Link key={t.id} href={`/tournaments/${t.id}`}>
                <Card className="group hover:border-cricket-amber-500/30 hover:glow-amber transition-all duration-300">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-bold">{t.name}</p>
                      <p className="text-sm text-muted-foreground">{t.format} · {t._count.matches} matches</p>
                    </div>
                    <div className="rounded-xl bg-cricket-amber-500/10 p-2.5">
                      <Trophy className="h-5 w-5 text-cricket-amber" />
                    </div>
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

// ─── Player Dashboard ─────────────────────────────────────────────────────────

async function PlayerDashboard({
  userId,
  playerId,
  name,
}: {
  userId: string;
  playerId: string | null;
  name: string | null;
}) {
  const player = await prisma.player.findUnique({
    where: { id: playerId ?? '' },
    include: {
      teamPlayers: { include: { team: true } },
      batterScores: {
        include: { innings: { include: { match: { include: { teamA: true, teamB: true } } } } },
        orderBy: { innings: { match: { createdAt: 'desc' } } },
      },
      bowlerScores: {
        include: { innings: { include: { match: { include: { teamA: true, teamB: true } } } } },
        orderBy: { innings: { match: { createdAt: 'desc' } } },
      },
      motmMatches: { select: { id: true } },
    },
  });

  if (!player) {
    return (
      <div className="p-4 sm:p-6 text-center text-muted-foreground">
        Player profile not found.
      </div>
    );
  }

  // Compute career batting stats
  const totalRuns = player.batterScores.reduce((s, b) => s + b.runs, 0);
  const innings = player.batterScores.length;
  const notOuts = player.batterScores.filter((b) => !b.isOut).length;
  const outs = innings - notOuts;
  const average = outs > 0 ? (totalRuns / outs).toFixed(1) : innings > 0 ? '∞' : '—';
  const totalBallsFaced = player.batterScores.reduce((s, b) => s + b.balls, 0);
  const strikeRate = totalBallsFaced > 0 ? ((totalRuns / totalBallsFaced) * 100).toFixed(1) : '—';
  const highScore = player.batterScores.reduce((hs, b) => Math.max(hs, b.runs), 0);
  const fifties = player.batterScores.filter((b) => b.runs >= 50 && b.runs < 100).length;
  const hundreds = player.batterScores.filter((b) => b.runs >= 100).length;

  // Bowling stats
  const totalWickets = player.bowlerScores.reduce((s, b) => s + b.wickets, 0);
  const totalRunsConceded = player.bowlerScores.reduce((s, b) => s + b.runs, 0);
  const totalOversBowled = player.bowlerScores.reduce((s, b) => s + b.overs, 0);
  const economy = totalOversBowled > 0 ? (totalRunsConceded / totalOversBowled).toFixed(1) : '—';
  const bowlingAvg = totalWickets > 0 ? (totalRunsConceded / totalWickets).toFixed(1) : '—';
  const bestFigures = player.bowlerScores.reduce(
    (best, b) => (b.wickets > best.w || (b.wickets === best.w && b.runs < best.r) ? { w: b.wickets, r: b.runs } : best),
    { w: 0, r: 0 }
  );

  // Last 5 matches personal performance (by innings date)
  const last5Batting = player.batterScores.slice(0, 5);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            {name?.split(' ')[0] ?? 'Player'} <span className="inline-block">🏏</span>
          </h1>
          <p className="mt-1 text-muted-foreground">{player.name} · {player.battingStyle} bat · {player.bowlingStyle}</p>
        </div>
        {player.motmMatches.length > 0 && (
          <div className="flex items-center gap-1.5 rounded-2xl bg-cricket-amber-500/10 border border-cricket-amber-500/20 px-3 py-2 text-sm font-semibold text-cricket-amber shrink-0">
            <Star className="h-4 w-4 fill-current" /> {player.motmMatches.length}× MOTM
          </div>
        )}
      </div>

      {/* Teams */}
      {player.teamPlayers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {player.teamPlayers.map(({ team }) => (
            <Link key={team.id} href={`/teams/${team.id}`}>
              <span className="flex items-center gap-1.5 rounded-full border border-border/30 bg-white/[0.04] px-3 py-1.5 text-xs font-medium hover:border-cricket-green-500/40 transition-colors">
                <Shield className="h-3 w-3 text-cricket-green" /> {team.name}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* Career Batting */}
      <div>
        <h2 className="mb-4 text-lg font-bold flex items-center gap-2">
          <Activity className="h-5 w-5 text-cricket-green" /> Career Batting
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[
            { label: 'Runs', value: totalRuns },
            { label: 'Innings', value: innings },
            { label: 'Avg', value: average },
            { label: 'SR', value: strikeRate },
            { label: 'HS', value: highScore },
            { label: '50s / 100s', value: `${fifties} / ${hundreds}` },
          ].map(({ label, value }) => (
            <Card key={label}>
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-black">{value}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5 font-medium uppercase tracking-wider">{label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Career Bowling */}
      {totalOversBowled > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-bold flex items-center gap-2">
            <Target className="h-5 w-5 text-cricket-amber" /> Career Bowling
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {[
              { label: 'Wickets', value: totalWickets },
              { label: 'Economy', value: economy },
              { label: 'Avg', value: bowlingAvg },
              { label: 'Best', value: bestFigures.w > 0 ? `${bestFigures.w}/${bestFigures.r}` : '—' },
            ].map(({ label, value }) => (
              <Card key={label}>
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-black">{value}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 font-medium uppercase tracking-wider">{label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Last 5 matches */}
      {last5Batting.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-400" /> Recent Performances
            </h2>
            <Link href="/history" className="text-sm text-cricket-green hover:underline font-medium flex items-center gap-1">
              Full history <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-2">
            {last5Batting.map((bs) => {
              const match = bs.innings.match;
              return (
                <Link key={bs.id} href={`/matches/${match.id}`}>
                  <Card className="hover:border-border/60 transition-all duration-200">
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-semibold text-sm">{match.teamA.name} vs {match.teamB.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatDate(match.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black">
                          {bs.runs}{!bs.isOut ? '*' : ''}
                          <span className="text-sm font-normal text-muted-foreground ml-1">({bs.balls})</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {bs.fours}×4 · {bs.sixes}×6
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {innings === 0 && totalOversBowled === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Activity className="h-8 w-8 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No match data yet</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Your stats will appear here once matches are recorded</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
