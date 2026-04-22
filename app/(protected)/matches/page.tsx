import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Activity, Trophy, Clock, ChevronRight, Circle } from 'lucide-react';
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
    const teamAInn = match.innings.find((i) => i.battingTeamId === match.teamAId);
    const teamBInn = match.innings.find((i) => i.battingTeamId === match.teamBId);
    const isLive = match.status === 'LIVE';
    const isCompleted = match.status === 'COMPLETED';

    let winnerName: string | undefined;
    let winnerTeamId: string | undefined;
    if (isCompleted && inn1 && inn2) {
      if (inn2.totalRuns > inn1.totalRuns) {
        winnerTeamId = inn2.battingTeamId;
        winnerName = inn2.battingTeamId === match.teamAId ? match.teamA.name : match.teamB.name;
      } else if (inn1.totalRuns > inn2.totalRuns) {
        winnerTeamId = inn1.battingTeamId;
        winnerName = inn1.battingTeamId === match.teamAId ? match.teamA.name : match.teamB.name;
      }
    }

    function TeamRow({ teamName, teamId, inn }: { teamName: string; teamId: string; inn: typeof teamAInn }) {
      const isWinner = winnerTeamId === teamId;
      return (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
              isWinner
                ? 'bg-gradient-to-br from-cricket-green-500 to-emerald-600 text-white shadow-md shadow-cricket-green-500/25'
                : 'bg-gradient-to-br from-white/[0.08] to-white/[0.03] text-muted-foreground/70'
            }`}>
              {teamName.substring(0, 2).toUpperCase()}
            </div>
            <span className={`font-semibold truncate ${isWinner ? 'text-foreground' : 'text-foreground/90'}`}>
              {teamName}
            </span>
            {isWinner && <Trophy className="h-3.5 w-3.5 text-cricket-green shrink-0" />}
          </div>
          <div className="text-right shrink-0">
            {inn ? (
              <div className="flex items-baseline gap-0.5">
                <span className={`text-xl font-black tabular-nums ${isWinner ? 'text-foreground' : 'text-foreground/90'}`}>
                  {inn.totalRuns}/{inn.totalWickets}
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  ({Math.floor(inn.totalOvers)}.{Math.round((inn.totalOvers % 1) * 6)} ov)
                </span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Yet to bat</span>
            )}
          </div>
        </div>
      );
    }

    return (
      <Link href={`/matches/${match.id}`} className="block group">
        <div className={[
          'relative rounded-xl overflow-hidden transition-all duration-200',
          'hover:shadow-lg hover:-translate-y-0.5',
          isLive
            ? 'bg-gradient-to-r from-red-500/[0.06] to-card/90 border border-red-500/20'
            : isCompleted
              ? 'bg-card/80 border border-border/30 hover:border-border/50'
              : 'bg-card/60 border border-border/20 hover:border-border/40',
        ].join(' ')}>

          {isLive && (
            <div className="h-[2px] bg-gradient-to-r from-red-500 via-orange-400 to-red-500" />
          )}

          <div className="px-4 py-3.5">
            {/* Top bar: date, venue, status badge */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span>{formatDate(match.createdAt)}</span>
                {match.venue && <><span>·</span><span>{match.venue}</span></>}
                {match.tournament && <><span>·</span><span className="text-cricket-amber font-medium">{match.tournament.name}</span></>}
              </div>
              {isLive && (
                <span className="flex items-center gap-1.5 rounded-full bg-red-500/15 border border-red-500/25 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-400">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                  </span>
                  Live
                </span>
              )}
              {isCompleted && (
                <span className="rounded-full bg-cricket-green-500/10 border border-cricket-green-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-cricket-green">
                  Completed
                </span>
              )}
              {!isLive && !isCompleted && (
                <span className="rounded-full bg-white/[0.04] border border-border/20 px-2.5 py-0.5 text-[10px] text-muted-foreground/50">
                  Upcoming
                </span>
              )}
            </div>

            {/* Team A row */}
            <TeamRow teamName={match.teamA.name} teamId={match.teamAId} inn={teamAInn} />

            {/* Divider */}
            <div className="my-2 border-t border-border/10" />

            {/* Team B row */}
            <TeamRow teamName={match.teamB.name} teamId={match.teamBId} inn={teamBInn} />

            {/* Result line */}
            {(winnerName || (isCompleted && !winnerName && inn1 && inn2)) && (
              <div className="mt-2.5 pt-2 border-t border-border/10 flex items-center justify-between">
                <span className={`text-xs font-semibold ${winnerName ? 'text-cricket-green' : 'text-cricket-amber'}`}>
                  {winnerName ? `${winnerName} won` : 'Match Tied'}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/20 group-hover:text-muted-foreground/50 group-hover:translate-x-0.5 transition-all" />
              </div>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Matches</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {matches.length} {matches.length === 1 ? 'match' : 'matches'}
            {live.length > 0 && <span className="text-red-400 font-medium"> · {live.length} live now</span>}
          </p>
        </div>
        <Button asChild>
          <Link href="/matches/new"><Plus className="mr-1.5 h-4 w-4" />New Match</Link>
        </Button>
      </div>

      {matches.length === 0 ? (
        <Card className="border-dashed border-border/20">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-5 mb-5">
              <Activity className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <p className="font-bold text-lg mb-1">No matches yet</p>
            <p className="text-sm text-muted-foreground/50 mb-5">Create your first match to start scoring</p>
            <Button asChild>
              <Link href="/matches/new"><Plus className="mr-1.5 h-4 w-4" />Create Match</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {live.length > 0 && (
            <section className="space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-red-400">Live</h2>
                <span className="text-xs text-muted-foreground/60">{live.length}</span>
              </div>
              <div className="space-y-2">
                {live.map((m) => <MatchCard key={m.id} match={m} />)}
              </div>
            </section>
          )}
          {upcoming.length > 0 && (
            <section className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-muted-foreground/40" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Upcoming</h2>
                <span className="text-xs text-muted-foreground/60">{upcoming.length}</span>
              </div>
              <div className="space-y-2">
                {upcoming.map((m) => <MatchCard key={m.id} match={m} />)}
              </div>
            </section>
          )}
          {completed.length > 0 && (
            <section className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Trophy className="h-3 w-3 text-muted-foreground/40" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Completed</h2>
                <span className="text-xs text-muted-foreground/60">{completed.length}</span>
              </div>
              <div className="space-y-2">
                {completed.map((m) => <MatchCard key={m.id} match={m} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

