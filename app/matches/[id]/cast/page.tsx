import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { formatOvers, legalBallCount, calcRunRate } from '@/lib/utils';
import { LiveMatchUpdater } from '@/components/LiveMatchUpdater';
import { CastAnimations } from '@/components/CastAnimations';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CastPage({ params }: { params: { id: string } }) {
  const match = await prisma.match.findUnique({
    where: { id: params.id },
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

  // Determine who is on strike (batsmanId of the last delivery)
  const allDeliveries = currentInnings?.deliveries ?? [];
  const strikerBatsmanId = allDeliveries[allDeliveries.length - 1]?.batsmanId ?? null;

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
      <CastAnimations matchId={match.id} />
      <div className="min-h-screen bg-[#0a0f1a] text-white flex flex-col select-none overflow-hidden font-sans">
        <div className="flex-1 flex flex-col p-5 md:p-8 gap-5">

          {/* ── Header ── */}
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xl font-black tracking-tight text-cricket-green">🏏 CricScorer</span>
              {match.tournament && (
                <span className="text-xs text-amber-400 border border-amber-400/30 rounded-full px-3 py-0.5 font-semibold">{match.tournament.name}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {match.status === 'LIVE' && (
                <span className="flex items-center gap-1.5 text-sm font-bold text-red-400 border border-red-500/30 rounded-full px-3 py-1">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />LIVE
                </span>
              )}
              {match.status === 'COMPLETED' && winnerName && (
                <span className="text-sm font-bold text-yellow-400 border border-yellow-500/30 rounded-full px-3 py-1">🏆 {winnerName} won</span>
              )}
              {match.status === 'COMPLETED' && !winnerName && (
                <span className="text-sm font-bold text-white/50 border border-white/20 rounded-full px-3 py-1">Match Tied</span>
              )}
              {match.venue && <span className="text-sm text-white/40">{match.venue}</span>}
            </div>
          </div>

          {/* ── Team score cards ── */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            {[
              { team: match.teamA, inn: teamAInn },
              { team: match.teamB, inn: teamBInn },
            ].map(({ team, inn }) => {
              const isCurrentBatting = currentInnings?.battingTeamId === team.id;
              const innLegalBalls = inn ? legalBallCount(inn.deliveries) : (isCurrentBatting ? totalBalls : null);
              return (
                <div
                  key={team.id}
                  className={`relative rounded-2xl border p-3 sm:p-5 md:p-6 overflow-hidden transition-all ${
                    isCurrentBatting ? 'border-cricket-green/40 bg-cricket-green/5' : 'border-white/10 bg-white/[0.02]'
                  }`}
                >
                  {isCurrentBatting && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cricket-green via-emerald-400 to-cricket-green" />
                  )}
                  <p className="text-[10px] sm:text-xs font-semibold text-white/50 uppercase tracking-widest mb-1 truncate">{team.name}</p>
                  <div className="flex items-end gap-1.5">
                    <span className="text-4xl sm:text-6xl md:text-8xl font-black tabular-nums leading-none">
                      {inn?.totalRuns ?? (isCurrentBatting ? currentInnings?.totalRuns ?? 0 : '—')}
                    </span>
                    <span className="text-2xl sm:text-3xl md:text-5xl font-black text-white/40 mb-0.5">
                      /{inn?.totalWickets ?? (isCurrentBatting ? currentInnings?.totalWickets ?? 0 : '')}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                    {innLegalBalls !== null ? (
                      <p className="text-xs sm:text-base text-white/50">({formatOvers(innLegalBalls)} ov)</p>
                    ) : (
                      <p className="text-xs sm:text-base text-white/30">Yet to bat</p>
                    )}
                    {isCurrentBatting && runRate && (
                      <span className="text-xs sm:text-base font-semibold text-cricket-green">RR {runRate}</span>
                    )}
                  </div>
                  {isCurrentBatting && runsNeeded != null && runsNeeded > 0 && match.status !== 'COMPLETED' && (
                    <div className="mt-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2 py-1">
                      <p className="text-xs text-amber-400 font-semibold">
                        Need {runsNeeded} off {(match.overs * 6) - totalBalls} balls
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Batsmen + Bowler panel ── */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 shrink-0">

            {/* Batsmen — 3 cols */}
            <div className="sm:col-span-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4 md:p-5">
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-3">Batsmen</p>
              {activeBatsmen.length === 0 ? (
                <p className="text-sm text-white/30 italic">No active batsmen</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {activeBatsmen.slice(0, 2).map((bs) => {
                    const isStriker = bs.playerId === strikerBatsmanId;
                    const sr = bs.balls > 0 ? ((bs.runs / bs.balls) * 100).toFixed(1) : '0.0';
                    return (
                      <div key={bs.id} className={`rounded-xl p-3 md:p-4 flex flex-col gap-2 border transition-all ${isStriker ? 'border-cricket-green/40 bg-cricket-green/5' : 'border-white/5 bg-white/[0.02]'}`}>
                        {/* Name row */}
                        <div className="flex items-center gap-2">
                          <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${isStriker ? 'bg-cricket-green/30 text-cricket-green' : 'bg-white/10 text-white/70'}`}>
                            {bs.player.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className={`font-bold text-sm truncate ${isStriker ? 'text-cricket-green' : 'text-white'}`}>
                              {bs.player.name}{isStriker && <span className="ml-1 text-cricket-green">*</span>}
                            </p>
                          </div>
                        </div>
                        {/* Score */}
                        <div className="flex items-end gap-2">
                          <span className="text-4xl md:text-5xl font-black tabular-nums leading-none">{bs.runs}</span>
                          <span className="text-lg text-white/40 mb-0.5">({bs.balls})</span>
                        </div>
                        {/* Stats */}
                        <div className="flex gap-3 text-xs text-white/50">
                          <span>SR <span className="text-white font-semibold">{sr}</span></span>
                          <span>4s <span className="text-blue-400 font-semibold">{bs.fours}</span></span>
                          <span>6s <span className="text-cricket-green font-semibold">{bs.sixes}</span></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bowler — 2 cols */}
            <div className="sm:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4 md:p-5">
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-3">Bowling</p>
              {activeBowler ? (
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-red-500/20 flex items-center justify-center text-[10px] sm:text-xs font-black text-red-400 shrink-0">
                      {activeBowler.player.name.substring(0, 2).toUpperCase()}
                    </div>
                    <p className="font-bold text-sm sm:text-base leading-tight truncate">{activeBowler.player.name}</p>
                  </div>
                  {/* Big stats row */}
                  <div className="flex items-end gap-1">
                    <span className="text-3xl sm:text-4xl md:text-5xl font-black tabular-nums leading-none">{activeBowler.wickets}</span>
                    <span className="text-lg sm:text-xl text-white/40 mb-0.5">/{activeBowler.runs}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="rounded-lg bg-white/5 p-1.5 sm:p-2 text-center">
                      <p className="text-[9px] sm:text-[10px] text-white/40 uppercase">Overs</p>
                      <p className="text-sm sm:text-base font-bold tabular-nums">{formatOvers(activeBowler.balls)}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 p-1.5 sm:p-2 text-center">
                      <p className="text-[9px] sm:text-[10px] text-white/40 uppercase">Econ</p>
                      <p className="text-sm sm:text-base font-bold tabular-nums">
                        {activeBowler.balls > 0 ? ((activeBowler.runs / activeBowler.balls) * 6).toFixed(1) : '—'}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/5 p-1.5 sm:p-2 text-center">
                      <p className="text-[9px] sm:text-[10px] text-white/40 uppercase">Mdns</p>
                      <p className="text-sm sm:text-base font-bold tabular-nums">{activeBowler.maidens}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-white/30 italic">No bowler yet</p>
              )}
            </div>
          </div>

          {/* ── Current over ── */}
          {currentOverBalls.length > 0 && (
            <div className="shrink-0 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 md:px-5 md:py-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">
                  Over {maxOver + 1}
                </p>
                {activeBowler && (
                  <p className="text-xs text-white/40">
                    <span className="text-white/70 font-semibold">{activeBowler.player.name}</span>
                    {' '}· {formatOvers(activeBowler.balls)} ov · {activeBowler.runs}R · {activeBowler.wickets}W
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {currentOverBalls.map((d, i) => (
                  <div
                    key={i}
                    className={`h-9 w-9 sm:h-11 sm:w-11 md:h-12 md:w-12 rounded-full flex items-center justify-center text-xs sm:text-sm font-black border-2 shrink-0 ${
                      d.isWicket          ? 'bg-red-600 border-red-400 text-white' :
                      d.isWide            ? 'bg-yellow-500 border-yellow-300 text-black' :
                      d.isNoBall          ? 'bg-orange-500 border-orange-300 text-white' :
                      d.runs === 6        ? 'bg-cricket-green border-cricket-green-400 text-white' :
                      d.runs === 4        ? 'bg-blue-500 border-blue-400 text-white' :
                      d.runs === 0        ? 'bg-white/5 border-white/20 text-white/50' :
                                            'bg-white/10 border-white/30 text-white'
                    }`}
                  >
                    {d.isWicket ? 'W' : d.isWide ? 'Wd' : d.isNoBall ? 'Nb' : d.runs}
                  </div>
                ))}
                {/* Empty placeholder dots for remaining balls */}
                {Array.from({ length: Math.max(0, 6 - currentOverBalls.filter(d => !d.isWide && !d.isNoBall).length) }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-9 w-9 sm:h-11 sm:w-11 md:h-12 md:w-12 rounded-full border-2 border-dashed border-white/10 shrink-0" />
                ))}
              </div>
            </div>
          )}

          {/* ── Footer ── */}
          <div className="shrink-0 flex items-center justify-between text-xs text-white/20">
            <span>Live on CricScorer</span>
            <span>cricket-scorer.app</span>
          </div>

        </div>
      </div>
    </>
  );
}
