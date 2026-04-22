import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { formatOvers, legalBallCount, calcRunRate } from '@/lib/utils';
import { LiveMatchUpdater } from '@/components/LiveMatchUpdater';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CastPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const match = await prisma.match.findFirst({
    where: {
      id: params.id,
      OR: [
        { userId: session.user.id },
        { teamA: { players: { some: { player: { userId: session.user.id } } } } },
        { teamB: { players: { some: { player: { userId: session.user.id } } } } },
      ],
    },
    include: {
      teamA: true,
      teamB: true,
      tournament: { select: { name: true } },
      innings: {
        include: {
          battingTeam: true,
          batterScores: { include: { player: true }, orderBy: { battingOrder: 'asc' } },
          bowlerScores: { include: { player: true } },
          deliveries: {
            orderBy: [{ overNumber: 'asc' }, { ballNumber: 'asc' }],
          },
        },
        orderBy: { inningsNumber: 'asc' },
      },
    },
  });

  if (!match) notFound();

  const currentInnings = match.innings.find((i) => !i.isCompleted) ?? match.innings[match.innings.length - 1];
  const prevInnings = match.innings.find((i) => i.inningsNumber === 1);

  const totalBalls = currentInnings ? legalBallCount(currentInnings.deliveries) : 0;
  const runRate = currentInnings ? calcRunRate(currentInnings.totalRuns, totalBalls) : '0.00';

  const target = currentInnings?.inningsNumber === 2 || currentInnings?.inningsNumber === 4
    ? (prevInnings?.totalRuns ?? 0) + 1
    : null;
  const runsNeeded = target ? target - (currentInnings?.totalRuns ?? 0) : null;

  const activeBatsmen = currentInnings?.batterScores?.filter((bs) => !bs.isOut) ?? [];

  // Last 6 deliveries for over summary
  const legal = currentInnings?.deliveries?.filter((d) => !d.isWide && !d.isNoBall) ?? [];
  const maxOver = legal.length > 0 ? Math.max(...legal.map((d) => d.overNumber)) : 0;
  const currentOverBalls = currentInnings?.deliveries?.filter((d) => d.overNumber === maxOver) ?? [];

  // Find the current bowler from the most recent delivery in the current over
  const lastDeliveryBowlerId = currentOverBalls[currentOverBalls.length - 1]?.bowlerId;
  const activeBowler = currentInnings?.bowlerScores?.find((bs) => bs.playerId === lastDeliveryBowlerId)
    ?? currentInnings?.bowlerScores?.slice().sort((a, b) => b.overs - a.overs)?.[0];

  const teamAInn = match.innings.find((i) => i.battingTeamId === match.teamAId && i.inningsNumber <= 2);
  const teamBInn = match.innings.find((i) => i.battingTeamId === match.teamBId && i.inningsNumber <= 2);

  // Derive winner name for completed matches
  let winnerName: string | null = null;
  if (match.status === 'COMPLETED' && teamAInn && teamBInn) {
    if (teamAInn.totalRuns > teamBInn.totalRuns) winnerName = match.teamA.name;
    else if (teamBInn.totalRuns > teamAInn.totalRuns) winnerName = match.teamB.name;
  }

  return (
    <>
      <LiveMatchUpdater matchId={match.id} />
      <div className="min-h-screen bg-[#0a0f1a] text-white flex flex-col select-none overflow-hidden">

        {/* Full-screen cast layout */}
        <div className="flex-1 flex flex-col justify-between p-6 md:p-10 gap-6">

          {/* Match header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-black tracking-tight text-cricket-green">🏏 CricScorer</div>
              {match.tournament && (
                <span className="text-xs text-amber-400 border border-amber-400/30 rounded-full px-3 py-1 font-semibold">{match.tournament.name}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {match.status === 'LIVE' && (
                <span className="flex items-center gap-1.5 text-sm font-bold text-red-400 border border-red-500/30 rounded-full px-3 py-1">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  LIVE
                </span>
              )}
              {match.status === 'COMPLETED' && winnerName && (
                <span className="flex items-center gap-1.5 text-sm font-bold text-yellow-400 border border-yellow-500/30 rounded-full px-3 py-1">
                  🏆 {winnerName} won
                </span>
              )}
              {match.status === 'COMPLETED' && !winnerName && (
                <span className="text-sm font-bold text-white/50 border border-white/20 rounded-full px-3 py-1">Match Tied</span>
              )}
              {match.venue && <span className="text-sm text-white/50">{match.venue}</span>}
            </div>
          </div>

          {/* Main scoreboard */}
          <div className="grid grid-cols-2 gap-6 flex-1">
            {[
              { team: match.teamA, inn: teamAInn },
              { team: match.teamB, inn: teamBInn },
            ].map(({ team, inn }, i) => {
              const isCurrentBatting = currentInnings?.battingTeamId === team.id;
              const innLegalBalls = inn ? legalBallCount(inn.deliveries) : (isCurrentBatting ? totalBalls : null);
              return (
                <div key={team.id} className={`rounded-2xl border p-6 md:p-8 flex flex-col justify-between relative overflow-hidden transition-all ${isCurrentBatting ? 'border-cricket-green/40 bg-cricket-green/5' : 'border-white/10 bg-white/[0.02]'}`}>
                  {isCurrentBatting && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cricket-green via-emerald-400 to-cricket-green" />}
                  <div>
                    <p className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-2">{team.name}</p>
                    <div className="flex items-end gap-3">
                      <span className="text-7xl md:text-9xl font-black tabular-nums">
                        {inn?.totalRuns ?? (isCurrentBatting ? currentInnings?.totalRuns ?? 0 : '—')}
                      </span>
                      <span className="text-4xl md:text-6xl font-black text-white/50 mb-2">
                        /{inn?.totalWickets ?? (isCurrentBatting ? currentInnings?.totalWickets ?? 0 : '')}
                      </span>
                    </div>
                    {innLegalBalls !== null && (
                      <p className="text-xl text-white/60">
                        ({formatOvers(innLegalBalls)} ov)
                        {isCurrentBatting && runRate && <span className="ml-3 text-cricket-green">RR {runRate}</span>}
                      </p>
                    )}
                    {innLegalBalls === null && (
                      <p className="text-xl text-white/40">Yet to bat</p>
                    )}
                  </div>
                  {isCurrentBatting && runsNeeded != null && runsNeeded > 0 && match.status !== 'COMPLETED' && (
                    <div className="mt-4 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-2">
                      <p className="text-sm text-amber-400 font-semibold">
                        Need {runsNeeded} runs from {(match.overs * 6) - totalBalls} balls
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Active batsmen */}
          {activeBatsmen.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs text-white/40 uppercase tracking-widest mb-3">At the Crease</p>
              <div className="grid grid-cols-2 gap-4">
                {activeBatsmen.slice(0, 2).map((bs) => (
                  <div key={bs.id} className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-cricket-green/20 flex items-center justify-center text-sm font-black text-cricket-green">
                      {bs.player.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{bs.player.name}</p>
                      <p className="text-xl font-black">{bs.runs}<span className="text-xs text-white/50 ml-1">({bs.balls})</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current over balls */}
          {currentOverBalls.length > 0 && (
            <div className="flex items-center gap-3">
              <p className="text-xs text-white/40 uppercase tracking-widest">This Over</p>
              <div className="flex gap-2">
                {currentOverBalls.map((d, i) => (
                  <div key={i} className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-black border ${
                    d.isWicket ? 'bg-red-600 border-red-500 text-white' :
                    d.isWide ? 'bg-yellow-500 border-yellow-400 text-black' :
                    d.isNoBall ? 'bg-orange-500 border-orange-400 text-white' :
                    d.runs === 6 ? 'bg-cricket-green border-cricket-green-500 text-white' :
                    d.runs === 4 ? 'bg-blue-500 border-blue-400 text-white' :
                    d.runs === 0 ? 'bg-white/5 border-white/20 text-white/60' :
                    'bg-white/10 border-white/20 text-white'
                  }`}>
                    {d.isWicket ? 'W' : d.isWide ? 'Wd' : d.isNoBall ? 'Nb' : d.runs}
                  </div>
                ))}
              </div>
              {activeBowler && (
                <p className="text-sm text-white/60 ml-auto">
                  <span className="font-bold text-white">{activeBowler.player.name}</span>
                  {' '}{formatOvers(Math.round(activeBowler.overs * 6))} ov · {activeBowler.runs}R · {activeBowler.wickets}W
                </p>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-white/30">
            <span>Live on CricScorer</span>
            <span>cricket-scorer.app</span>
          </div>
        </div>
      </div>
    </>
  );
}
