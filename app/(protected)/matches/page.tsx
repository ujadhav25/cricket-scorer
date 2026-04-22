import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Activity, Trophy, Radio, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default async function MatchesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const matches = await prisma.match.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        { teamA: { players: { some: { player: { userId: session.user.id } } } } },
        { teamB: { players: { some: { player: { userId: session.user.id } } } } },
      ],
    },
    include: {
      teamA: true, teamB: true,
      tournament: { select: { name: true } },
      innings: { select: { totalRuns: true, totalWickets: true, totalOvers: true, inningsNumber: true, battingTeamId: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const live = matches.filter((m) => m.status === 'LIVE');
  const upcoming = matches.filter((m) => m.status === 'UPCOMING');
  const completed = matches.filter((m) => m.status === 'COMPLETED');

  function MatchCard({ match }: { match: typeof matches[0] }) {
    const inn1 = match.innings.find((i) => i.inningsNumber === 1);
    const inn2 = match.innings.find((i) => i.inningsNumber === 2);

    // Score for each team regardless of innings order
    const teamAInn = match.innings.find((i) => i.battingTeamId === match.teamAId);
    const teamBInn = match.innings.find((i) => i.battingTeamId === match.teamBId);

    const isLive = match.status === 'LIVE';
    const isCompleted = match.status === 'COMPLETED';

    // Winner
    let winnerName: string | undefined;
    if (isCompleted && inn1 && inn2) {
      const inn2BattingTeamName = inn2.battingTeamId === match.teamAId ? match.teamA.name : match.teamB.name;
      const inn1BattingTeamName = inn1.battingTeamId === match.teamAId ? match.teamA.name : match.teamB.name;
      if (inn2.totalRuns > inn1.totalRuns) winnerName = inn2BattingTeamName;
      else if (inn1.totalRuns > inn2.totalRuns) winnerName = inn1BattingTeamName;
    }

    return (
      <Link href={`/matches/${match.id}`} className="block group">
        <div className={[
          'relative rounded-2xl border overflow-hidden transition-all duration-300',
          'hover:shadow-lg hover:-translate-y-0.5',
          isLive
            ? 'border-red-500/30 bg-card/80 shadow-md'
            : 'border-border/30 bg-card/60 hover:border-border/50',
        ].join(' ')}>

          {/* Live pulse bar */}
          {isLive && <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-red-500 via-orange-400 to-red-500 animate-pulse" />}

          <div className="p-4">
            {/* Top row: teams + status */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-base truncate">{match.teamA.name}</span>
                  <span className="text-xs text-muted-foreground font-medium px-1">vs</span>
                  <span className="font-bold text-base truncate">{match.teamB.name}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-muted-foreground">
                  <span>{formatDate(match.createdAt)}</span>
                  {match.venue && <><span>·</span><span>{match.venue}</span></>}
                  {match.tournament && (
                    <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-amber-400 font-medium">
                      {match.tournament.name}
                    </span>
                  )}
                </div>
              </div>
              <div className="shrink-0">
                {isLive && (
                  <span className="flex items-center gap-1.5 rounded-full bg-red-500/15 border border-red-500/30 px-2.5 py-1 text-xs font-bold text-red-400 animate-pulse">
                    <Radio className="h-3 w-3" /> LIVE
                  </span>
                )}
                {isCompleted && (
                  <span className="flex items-center gap-1 rounded-full bg-cricket-green-500/10 border border-cricket-green-500/20 px-2.5 py-1 text-xs font-semibold text-cricket-green">
                    <Trophy className="h-3 w-3" /> Done
                  </span>
                )}
                {!isLive && !isCompleted && (
                  <span className="flex items-center gap-1 rounded-full bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> Upcoming
                  </span>
                )}
              </div>
            </div>

            {/* Scores */}
            {(teamAInn || teamBInn) && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {[
                  { team: match.teamA, inn: teamAInn, color: 'blue' },
                  { team: match.teamB, inn: teamBInn, color: 'rose' },
                ].map(({ team, inn, color }) => (
                  <div key={team.id} className={[
                    'rounded-xl px-3 py-2.5',
                    color === 'blue' ? 'bg-blue-500/[0.06] border border-blue-500/10' : 'bg-rose-500/[0.06] border border-rose-500/10',
                  ].join(' ')}>
                    <p className={`text-xs font-medium truncate mb-0.5 ${color === 'blue' ? 'text-blue-400' : 'text-rose-400'}`}>{team.name}</p>
                    {inn ? (
                      <p className="text-lg font-black leading-none">
                        {inn.totalRuns}<span className="text-sm font-semibold text-muted-foreground">/{inn.totalWickets}</span>
                        <span className="text-xs text-muted-foreground ml-1.5">({Math.floor(inn.totalOvers)}.{Math.round((inn.totalOvers % 1) * 6)} ov)</span>
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Yet to bat</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Winner strip */}
            {winnerName && (
              <div className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-yellow-400">
                <Trophy className="h-3.5 w-3.5" /> {winnerName} won
              </div>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Matches</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{matches.length} {matches.length === 1 ? 'match' : 'matches'}</p>
        </div>
        <Button asChild>
          <Link href="/matches/new"><Plus className="mr-1.5 h-4 w-4" />New Match</Link>
        </Button>
      </div>

      {matches.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <div className="rounded-2xl bg-white/[0.04] p-4 mb-4">
              <Activity className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <p className="font-bold mb-1">No matches yet</p>
            <p className="text-sm text-muted-foreground mb-4">Create your first match to start scoring</p>
            <Button asChild>
              <Link href="/matches/new"><Plus className="mr-1.5 h-4 w-4" />Create Match</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {live.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5" /> Live
              </h2>
              {live.map((m) => <MatchCard key={m.id} match={m} />)}
            </section>
          )}
          {upcoming.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Upcoming
              </h2>
              {upcoming.map((m) => <MatchCard key={m.id} match={m} />)}
            </section>
          )}
          {completed.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5" /> Completed
              </h2>
              {completed.map((m) => <MatchCard key={m.id} match={m} />)}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

