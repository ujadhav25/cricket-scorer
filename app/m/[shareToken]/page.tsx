import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { formatOvers, calcRunRate, calcStrikeRate, calcBowlingEconomy, legalBallCount, legalBallCountForBowler } from '@/lib/utils';
import { LiveMatchUpdater } from '@/components/LiveMatchUpdater';
import { LiveReactions } from '@/components/LiveReactions';
import { serverT } from '@/lib/locale';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: { params: { shareToken: string } }): Promise<Metadata> {
  const match = await prisma.match.findUnique({
    where: { shareToken: params.shareToken },
    select: { teamA: { select: { name: true } }, teamB: { select: { name: true } }, status: true, venue: true },
  });

  if (!match) return { title: 'Match Not Found | CricScorer' };

  const title = `${match.teamA.name} vs ${match.teamB.name} | CricScorer`;
  const statusLabel = match.status === 'LIVE' ? '🔴 LIVE — ' : match.status === 'COMPLETED' ? 'Match Result — ' : 'Upcoming — ';
  const description = `${statusLabel}${match.teamA.name} vs ${match.teamB.name}${match.venue ? ` at ${match.venue}` : ''}. Follow live scores on CricScorer.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'CricScorer',
      images: [{ url: `/api/og/match/${params.shareToken}`, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/api/og/match/${params.shareToken}`],
    },
  };
}

// Build a commentary line for a single delivery
function commentaryLine(
  ball: { runs: number; isWide: boolean; isNoBall: boolean; isLegBye: boolean; isBye: boolean; isWicket: boolean; wicketType: string | null; overNumber: number; ballNumber: number },
  batsmanName: string,
  bowlerName: string,
  fielderName?: string | null,
): string {
  const over = `${ball.overNumber + 1}.${ball.ballNumber}`;
  if (ball.isWicket) {
    const how = ball.wicketType ?? 'Out';
    if (how === 'Caught' && fielderName) return `${over} — OUT! ${batsmanName} caught by ${fielderName} b ${bowlerName}`;
    if (how === 'Caught') return `${over} — OUT! ${batsmanName} caught & bowled ${bowlerName}`;
    if (how === 'Bowled') return `${over} — OUT! ${batsmanName} bowled by ${bowlerName}`;
    if (how === 'LBW') return `${over} — OUT! ${batsmanName} lbw b ${bowlerName}`;
    if (how === 'RunOut') return `${over} — OUT! ${fielderName ? fielderName + ' runs out ' : 'Run out '}${batsmanName}`;
    if (how === 'Stumped') return `${over} — OUT! ${batsmanName} stumped by ${fielderName ?? 'keeper'} b ${bowlerName}`;
    if (how === 'HitWicket') return `${over} — OUT! ${batsmanName} hit wicket b ${bowlerName}`;
    return `${over} — OUT! ${batsmanName} ${how} by ${bowlerName}`;
  }
  if (ball.isWide) return `${over} — Wide${ball.runs > 1 ? `, ${ball.runs - 1} run${ball.runs - 1 > 1 ? 's' : ''} extra` : ''}`;
  if (ball.isNoBall) return `${over} — No Ball${ball.runs > 0 ? `, ${ball.runs} off the bat by ${batsmanName}` : ''}`;
  if (ball.runs === 0) return `${over} — Dot ball. ${bowlerName} to ${batsmanName}, no run`;
  if (ball.runs === 4) return `${over} — FOUR! ${batsmanName} hits ${bowlerName} for a boundary`;
  if (ball.runs === 6) return `${over} — SIX! ${batsmanName} smashes ${bowlerName} for a maximum`;
  const extra = ball.isLegBye ? ' (Leg bye)' : ball.isBye ? ' (Bye)' : '';
  return `${over} — ${ball.runs} run${ball.runs > 1 ? 's' : ''}${extra}. ${batsmanName} off ${bowlerName}`;
}

export default async function PublicMatchPage({ params }: { params: { shareToken: string } }) {
  const match = await prisma.match.findUnique({
    where: { shareToken: params.shareToken },
    include: {
      teamA: true,
      teamB: true,
      tournament: { select: { name: true } },
      innings: {
        include: {
          battingTeam: true,
          batterScores: { include: { player: true }, orderBy: { battingOrder: 'asc' } },
          bowlerScores: { include: { player: true } },
          deliveries: { include: { batsman: true, bowler: true, fielder: true }, orderBy: [{ overNumber: 'asc' }, { ballNumber: 'asc' }] },
        },
        orderBy: { inningsNumber: 'asc' },
      },
    },
  });

  if (!match) notFound();

  // Fetch reaction counts server-side so they show on first load
  const reactionRows = await prisma.matchReaction.findMany({
    where: { matchId: match.id },
    select: { emoji: true, count: true },
  });
  const initialReactionCounts: Record<string, number> = {};
  for (const r of reactionRows) initialReactionCounts[r.emoji] = r.count;

  const t = serverT();
  const isLive = match.status === 'LIVE';
  const isCompleted = match.status === 'COMPLETED';

  const inn1 = match.innings.find((i) => i.inningsNumber === 1);
  const inn2 = match.innings.find((i) => i.inningsNumber === 2);
  const inn3 = match.innings.find((i) => i.inningsNumber === 3);
  const inn4 = match.innings.find((i) => i.inningsNumber === 4);

  let winnerName: string | undefined;
  let resultLine: string | undefined;
  if (isCompleted) {
    // Super over result takes precedence
    if (inn3 && inn4) {
      const t3Name = inn3.battingTeamId === match.teamAId ? match.teamA.name : match.teamB.name;
      const t4Name = inn4.battingTeamId === match.teamAId ? match.teamA.name : match.teamB.name;
      if (inn4.totalRuns > inn3.totalRuns) {
        winnerName = t4Name;
        resultLine = `${t4Name} won the Super Over`;
      } else if (inn3.totalRuns > inn4.totalRuns) {
        winnerName = t3Name;
        resultLine = `${t3Name} won the Super Over`;
      } else {
        resultLine = 'Match tied (Super Over also tied)';
      }
    } else if (inn1 && inn2) {
      const t2Name = inn2.battingTeamId === match.teamAId ? match.teamA.name : match.teamB.name;
      const t1Name = inn1.battingTeamId === match.teamAId ? match.teamA.name : match.teamB.name;
      if (inn2.totalRuns > inn1.totalRuns) {
        winnerName = t2Name;
        const wicketsLeft = 10 - inn2.totalWickets;
        resultLine = `${t2Name} won by ${wicketsLeft} wicket${wicketsLeft !== 1 ? 's' : ''}`;
      } else if (inn1.totalRuns > inn2.totalRuns) {
        winnerName = t1Name;
        const runMargin = inn1.totalRuns - inn2.totalRuns;
        resultLine = `${t1Name} won by ${runMargin} run${runMargin !== 1 ? 's' : ''}`;
      } else {
        resultLine = 'Match tied';
      }
    }
  }

  // Current innings for live display
  const currentInnings = match.innings.find((i) => !i.isCompleted) ?? match.innings[match.innings.length - 1];
  const allLegal = currentInnings?.deliveries.filter((d) => !d.isWide && !d.isNoBall) ?? [];
  const maxOver = allLegal.length > 0 ? Math.max(...allLegal.map((d) => d.overNumber)) : 0;
  const maxOverBalls = allLegal.filter((d) => d.overNumber === maxOver);
  // Same formula as scoring page — advances to next over after 6 legal balls
  const derivedCurrentOver = maxOverBalls.length >= 6 ? maxOver + 1 : maxOver;
  const legalInCurrentOver = allLegal.filter((d) => d.overNumber === derivedCurrentOver);
  const currentOverDeliveries = currentInnings?.deliveries.filter((d) => d.overNumber === derivedCurrentOver) ?? [];
  const currentInnLegalBalls = legalBallCount(currentInnings?.deliveries ?? []);

  return (
    <div className="min-h-screen bg-[#0a0f0a] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0d1a0d] px-4 py-3">
        <div className="mx-auto max-w-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏏</span>
            <span className="font-bold text-cricket-green text-sm">CricScorer</span>
          </div>
          {isLive && (
            <span className="flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1 text-xs font-bold animate-pulse">
              ● {t('match.live').toUpperCase()}
            </span>
          )}
          {isCompleted && (
            <span className="rounded-full bg-green-700 px-3 py-1 text-xs font-semibold">{t('match.completed').toUpperCase()}</span>
          )}
          {!isLive && !isCompleted && (
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/60">{t('match.upcoming').toUpperCase()}</span>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 py-5 space-y-4">
        {/* Match title */}
        <div className="text-center">
          {match.tournament && (
            <p className="text-xs text-amber-400 font-medium mb-1">{match.tournament.name}</p>
          )}
          <h1 className="text-xl font-black">{match.teamA.name} vs {match.teamB.name}</h1>
          {match.venue && <p className="text-xs text-white/50 mt-0.5">{match.venue}</p>}
          {resultLine && (
            <p className="mt-2 text-base font-bold text-yellow-400">🏆 {resultLine}</p>
          )}
        </div>

        {/* Score summary cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { team: match.teamA, inn: match.innings.find((i) => i.battingTeamId === match.teamAId), color: 'blue' },
            { team: match.teamB, inn: match.innings.find((i) => i.battingTeamId === match.teamBId), color: 'rose' },
          ].map(({ team, inn, color }) => {
            const isWinner = winnerName === team.name;
            return (
              <div key={team.id} className={[
                'rounded-xl border p-4',
                color === 'blue' ? 'border-blue-500/30 bg-blue-950/30' : 'border-rose-500/30 bg-rose-950/30',
                isWinner ? 'ring-2 ring-yellow-400/60' : '',
              ].join(' ')}>
                <div className={`h-0.5 rounded-full mb-2 ${color === 'blue' ? 'bg-blue-500' : 'bg-rose-500'}`} />
                {isWinner && <div className="text-xs font-bold text-yellow-400 mb-1">🏆 {t('match.winner')}</div>}
                <p className={`text-xs font-medium mb-1 ${color === 'blue' ? 'text-blue-400' : 'text-rose-400'}`}>{team.name}</p>
                {inn ? (
                  <>
                    <p className="text-2xl font-black leading-none">
                      {inn.totalRuns}<span className="text-lg text-white/50">/{inn.totalWickets}</span>
                    </p>
                    <p className="text-xs text-white/50 mt-0.5">({formatOvers(legalBallCount(inn.deliveries))} ov)</p>
                  </>
                ) : (
                  <p className="text-sm text-white/40">{t('match.yetToBat')}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Live: current over balls */}
        {isLive && currentInnings && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/50 font-medium mb-2">{t('match.overs')} {derivedCurrentOver + 1} — {t('match.inProgress')}</p>
            <div className="flex gap-2 flex-wrap">
              {currentOverDeliveries.map((d, i) => {
                let label = d.runs === 0 ? '•' : String(d.runs);
                if (d.isWide) label = 'Wd';
                if (d.isNoBall) label = d.runs > 0 ? `Nb+${d.runs}` : 'Nb';
                if (d.isWicket) label = 'W';
                return (
                  <div key={i} className={[
                    'h-8 min-w-8 px-1.5 flex items-center justify-center rounded-full text-xs font-bold',
                    d.isWicket ? 'bg-red-600' :
                    d.runs === 4 && !d.isWide && !d.isNoBall ? 'bg-blue-600' :
                    d.runs === 6 && !d.isWide && !d.isNoBall ? 'bg-green-600' :
                    (d.isWide || d.isNoBall) ? 'bg-yellow-600' :
                    d.runs > 0 ? 'bg-white text-black' : 'bg-white/15',
                  ].join(' ')}>
                    {label}
                  </div>
                );
              })}
              {Array.from({ length: Math.max(0, 6 - legalInCurrentOver.length) }).map((_, i) => (
                <div key={`e-${i}`} className="h-8 w-8 rounded-full border border-dashed border-white/20" />
              ))}
            </div>
          </div>
        )}

        {/* Target (innings 2 live) or Result (completed) */}
        {inn2 && inn1 && (
          isCompleted ? (
            resultLine ? (
              <div className="rounded-xl border border-yellow-500/30 bg-yellow-950/20 px-4 py-3 text-sm text-center">
                <span className="font-bold text-yellow-400">🏆 {resultLine}</span>
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-center text-white/50">Match tied</div>
            )
          ) : isLive && currentInnings?.inningsNumber === 2 ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 px-4 py-3 text-sm">
              <span className="font-semibold text-amber-400">{t('match.target')}: {inn1.totalRuns + 1}</span>
              {' · '}
              <span className="text-white/70">
                Need {Math.max(0, inn1.totalRuns + 1 - currentInnings.totalRuns)} off{' '}
                {Math.max(0, match.overs * 6 - currentInnLegalBalls)} balls
              </span>
            </div>
          ) : null
        )}

        {/* Scorecards */}
        {match.innings.map((inn) => {
          const isTeamA = inn.battingTeamId === match.teamAId;
          return (
            <div key={inn.id} className={[
              'rounded-xl border overflow-hidden',
              isTeamA ? 'border-blue-500/25' : 'border-rose-500/25',
            ].join(' ')}>
              <div className={`px-4 py-2.5 ${isTeamA ? 'bg-blue-950/40' : 'bg-rose-950/40'} border-b ${isTeamA ? 'border-blue-500/25' : 'border-rose-500/25'}`}>
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${isTeamA ? 'bg-blue-500' : 'bg-rose-500'}`} />
                  <span className="font-bold text-sm">{inn.battingTeam.name}</span>
                  <span className="text-xs text-white/40">· {inn.inningsNumber <= 2 ? `${t('match.innings')} ${inn.inningsNumber}` : t('match.superOver')}</span>
                </div>
              </div>
              <div className="p-4 space-y-4">
                {/* Batting */}
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isTeamA ? 'text-blue-400' : 'text-rose-400'}`}>{t('match.batting')}</p>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-white/40 border-b border-white/10">
                        <th className="pb-1 pr-3 text-left font-medium">{t('bat.batsman')}</th>
                        <th className="pb-1 pr-2 text-right font-medium">{t('bat.r')}</th>
                        <th className="pb-1 pr-2 text-right font-medium">{t('bat.b')}</th>
                        <th className="pb-1 pr-2 text-right font-medium">{t('bat.4s')}</th>
                        <th className="pb-1 pr-2 text-right font-medium">{t('bat.6s')}</th>
                        <th className="pb-1 text-right font-medium">{t('bat.sr')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inn.batterScores.map((bs) => (
                        <tr key={bs.id} className="border-b border-white/5">
                          <td className="py-1.5 pr-3">
                            <p className="font-medium">{bs.player.name}{!bs.isOut ? '*' : ''}</p>
                            {bs.dismissalType && <p className="text-white/40">{bs.dismissalType}</p>}
                          </td>
                          <td className="py-1.5 pr-2 text-right font-bold">{bs.runs}</td>
                          <td className="py-1.5 pr-2 text-right text-white/50">{bs.balls}</td>
                          <td className="py-1.5 pr-2 text-right">{bs.fours}</td>
                          <td className="py-1.5 pr-2 text-right">{bs.sixes}</td>
                          <td className="py-1.5 text-right text-white/50">{calcStrikeRate(bs.runs, bs.balls)}</td>
                        </tr>
                      ))}
                      <tr>
                        <td className="pt-2 text-white/40 text-xs" colSpan={2}>{t('match.extras')}</td>
                        <td className="pt-2 text-right text-white/40 text-xs" colSpan={4}>
                          {t('match.wideShort')} {inn.wides} · {t('match.noballShort')} {inn.noBalls} · {t('match.legbyeShort')} {inn.legByes} · {t('match.byeShort')} {inn.byes}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Over history — horizontal scroll */}
                {inn.deliveries.length > 0 && (() => {
                  const overNums = [...new Set(inn.deliveries.map((d) => d.overNumber))].sort((a, b) => a - b);
                  return (
                    <div>
                      <div className={`border-t mb-3 ${isTeamA ? 'border-blue-500/15' : 'border-rose-500/15'}`} />
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isTeamA ? 'text-blue-400' : 'text-rose-400'}`}>
                        {t('match.overs')}
                      </p>
                      <div className="overflow-x-auto pb-1 -mx-1 px-1">
                        <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
                          {overNums.map((overNum) => {
                            const balls = inn.deliveries.filter((d) => d.overNumber === overNum);
                            const overRuns = balls.reduce((s, d) => s + d.runs, 0);
                            return (
                              <div key={overNum} className="flex flex-col items-center gap-1.5">
                                <p className="text-xs text-white/40">Ov {overNum + 1}</p>
                                <div className="flex gap-1">
                                  {balls.map((d, i) => {
                                    let label: string = d.runs === 0 ? '•' : String(d.runs);
                                    if (d.isWide) label = 'Wd';
                                    else if (d.isNoBall) label = d.runs > 0 ? `+${d.runs}` : 'Nb';
                                    if (d.isWicket) label = 'W';
                                    return (
                                      <div
                                        key={i}
                                        className={[
                                          'h-7 w-7 flex items-center justify-center rounded-full text-xs font-bold',
                                          d.isWicket ? 'bg-red-600 text-white' :
                                          d.runs === 4 && !d.isWide && !d.isNoBall ? 'bg-blue-600 text-white' :
                                          d.runs === 6 && !d.isWide && !d.isNoBall ? 'bg-green-600 text-white' :
                                          (d.isWide || d.isNoBall) ? 'bg-yellow-500 text-black' :
                                          d.runs > 0 ? 'bg-white text-black' : 'bg-white/15 text-white',
                                        ].join(' ')}
                                      >
                                        {label}
                                      </div>
                                    );
                                  })}
                                </div>
                                <p className="text-xs text-white/50 font-semibold">{overRuns}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className={`border-t ${isTeamA ? 'border-blue-500/15' : 'border-rose-500/15'}`} />

                {/* Bowling */}
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isTeamA ? 'text-blue-400' : 'text-rose-400'}`}>{t('match.bowling')}</p>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-white/40 border-b border-white/10">
                        <th className="pb-1 pr-3 text-left font-medium">{t('bowl.bowler')}</th>
                        <th className="pb-1 pr-2 text-right font-medium">{t('bowl.o')}</th>
                        <th className="pb-1 pr-2 text-right font-medium">{t('bowl.r')}</th>
                        <th className="pb-1 pr-2 text-right font-medium">{t('bowl.w')}</th>
                        <th className="pb-1 text-right font-medium">{t('bowl.econ')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inn.bowlerScores.map((bs) => (
                        <tr key={bs.id} className="border-b border-white/5">
                          <td className="py-1.5 pr-3 font-medium">{bs.player.name}</td>
                          <td className="py-1.5 pr-2 text-right text-white/50">{formatOvers(legalBallCountForBowler(inn.deliveries, bs.playerId))}</td>
                          <td className="py-1.5 pr-2 text-right">{bs.runs}</td>
                          <td className={`py-1.5 pr-2 text-right font-bold ${bs.wickets > 0 ? 'text-green-400' : 'text-white/50'}`}>{bs.wickets}</td>
                          <td className="py-1.5 text-right text-white/50">{calcBowlingEconomy(bs.runs, legalBallCountForBowler(inn.deliveries, bs.playerId))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })}

        {/* Commentary */}
        {match.innings.map((inn) => {
          if (inn.deliveries.length === 0) return null;
          const isTeamA = inn.battingTeam.id === match.teamAId;
          // Group deliveries by over
          const overNums = [...new Set(inn.deliveries.map((d) => d.overNumber))].sort((a, b) => b - a);
          return (
            <div key={`comm-${inn.id}`} className={`rounded-xl border overflow-hidden ${isTeamA ? 'border-blue-500/25' : 'border-rose-500/25'}`}>
              <div className={`px-4 py-2.5 ${isTeamA ? 'bg-blue-950/40' : 'bg-rose-950/40'} border-b ${isTeamA ? 'border-blue-500/25' : 'border-rose-500/25'}`}>
                <span className="font-bold text-sm">{inn.battingTeam.name}</span>
                <span className="text-xs text-white/40 ml-2">· {inn.inningsNumber <= 2 ? `Innings ${inn.inningsNumber}` : 'Super Over'} — Commentary</span>
              </div>
              <div className="divide-y divide-white/5">
                {overNums.map((overNum) => {
                  const balls = inn.deliveries.filter((d) => d.overNumber === overNum);
                  const overRuns = balls.reduce((s, d) => s + d.runs, 0);
                  return (
                    <details key={overNum} className="group">
                      <summary className="flex items-center justify-between px-4 py-2.5 cursor-pointer select-none hover:bg-white/5 transition-colors">
                        <span className="text-xs font-semibold text-white/60">Over {overNum + 1}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-white/40">{overRuns} runs</span>
                          <div className="flex gap-1">
                            {balls.map((d, i) => {
                              let label: string = d.runs === 0 ? '•' : String(d.runs);
                              if (d.isWide) label = 'Wd';
                              else if (d.isNoBall) label = 'Nb';
                              if (d.isWicket) label = 'W';
                              return (
                                <span key={i} className={`h-5 w-5 text-[10px] flex items-center justify-center rounded-full font-bold ${
                                  d.isWicket ? 'bg-red-600' :
                                  d.runs === 4 && !d.isWide && !d.isNoBall ? 'bg-blue-600' :
                                  d.runs === 6 && !d.isWide && !d.isNoBall ? 'bg-green-600' :
                                  (d.isWide || d.isNoBall) ? 'bg-yellow-500 text-black' :
                                  d.runs > 0 ? 'bg-white text-black' : 'bg-white/15'
                                }`}>{label}</span>
                              );
                            })}
                          </div>
                        </div>
                      </summary>
                      <div className="px-4 pb-2 space-y-1.5">
                        {[...balls].reverse().map((d, i) => (
                          <p key={i} className={`text-xs py-1.5 border-b border-white/5 last:border-0 ${d.isWicket ? 'text-red-300 font-semibold' : d.runs === 6 ? 'text-green-300' : d.runs === 4 ? 'text-blue-300' : 'text-white/70'}`}>
                            {commentaryLine(d, d.batsman.name, d.bowler.name, d.fielder?.name)}
                          </p>
                        ))}
                      </div>
                    </details>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* ── HIGHLIGHTS REEL ── */}
        {(() => {
          type HL = { emoji: string; label: string; detail: string; color: string };
          const highlights: HL[] = [];

          match.innings.forEach((inn) => {
            // Boundaries & wickets per ball
            inn.deliveries.forEach((d) => {
              if (d.isWicket) {
                const how = d.wicketType ?? 'Out';
                const fielder = d.fielder ? ` (${d.fielder.name})` : '';
                highlights.push({
                  emoji: '🎯',
                  label: `WICKET — ${d.batsman.name}`,
                  detail: `${how}${fielder} • ${d.overNumber + 1}.${d.ballNumber} ov • ${inn.battingTeam.name}`,
                  color: 'border-red-500/30 bg-red-950/30 text-red-300',
                });
              } else if (d.runs === 6 && !d.isWide && !d.isNoBall) {
                highlights.push({
                  emoji: '💥',
                  label: `SIX — ${d.batsman.name}`,
                  detail: `off ${d.bowler.name} • ${d.overNumber + 1}.${d.ballNumber} ov • ${inn.battingTeam.name}`,
                  color: 'border-green-500/30 bg-green-950/30 text-green-300',
                });
              } else if (d.runs === 4 && !d.isWide && !d.isNoBall) {
                highlights.push({
                  emoji: '🏏',
                  label: `FOUR — ${d.batsman.name}`,
                  detail: `off ${d.bowler.name} • ${d.overNumber + 1}.${d.ballNumber} ov • ${inn.battingTeam.name}`,
                  color: 'border-blue-500/30 bg-blue-950/30 text-blue-300',
                });
              }
            });

            // Milestones from batter scores
            inn.batterScores.forEach((bs) => {
              if (bs.runs >= 100) highlights.push({ emoji: '💯', label: `CENTURY — ${bs.player.name}`, detail: `${bs.runs} (${bs.balls}b) • ${inn.battingTeam.name}`, color: 'border-yellow-500/30 bg-yellow-950/30 text-yellow-300' });
              else if (bs.runs >= 50) highlights.push({ emoji: '⭐', label: `FIFTY — ${bs.player.name}`, detail: `${bs.runs} (${bs.balls}b) • ${inn.battingTeam.name}`, color: 'border-yellow-500/20 bg-yellow-950/20 text-yellow-400' });
            });

            // 5-wicket hauls
            inn.bowlerScores.forEach((bs) => {
              if (bs.wickets >= 5) highlights.push({ emoji: '🔥', label: `5-WICKET HAUL — ${bs.player.name}`, detail: `${bs.wickets}/${bs.runs} • ${inn.battingTeam.name} innings`, color: 'border-purple-500/30 bg-purple-950/30 text-purple-300' });
            });
          });

          if (highlights.length === 0) return null;

          return (
            <div className="rounded-xl border border-white/15 overflow-hidden">
              <div className="flex items-center gap-2 bg-white/5 border-b border-white/10 px-4 py-2.5">
                <span className="text-sm">⚡</span>
                <span className="text-sm font-bold">Match Highlights</span>
                <span className="ml-auto text-xs text-white/40">{highlights.length} moments</span>
              </div>
              <div className="divide-y divide-white/5">
                {highlights.map((h, i) => (
                  <div key={i} className={`flex items-start gap-3 px-4 py-3 ${h.color} border-l-2`}>
                    <span className="text-lg shrink-0 mt-0.5">{h.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold leading-tight">{h.label}</p>
                      <p className="text-xs text-white/50 mt-0.5">{h.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Auto-refresh every 10s when live */}
        {isLive && <LiveMatchUpdater matchId={match.id} />}
        {/* Emoji reactions — visible on all live matches */}
        {isLive && <LiveReactions matchId={match.id} initialCounts={initialReactionCounts} />}

        <p className="text-center text-xs text-white/20 pb-2">Powered by CricScorer</p>
      </div>
    </div>
  );
}
