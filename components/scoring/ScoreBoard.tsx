'use client';

import { calcRunRate, formatOvers } from '@/lib/utils';

interface ScoreBoardProps {
  teamAName: string;
  teamBName: string;
  battingTeamId: string;
  teamAId: string;
  innings: {
    totalRuns: number;
    totalWickets: number;
    totalOvers: number;
    extras: number;
    wides: number;
    noBalls: number;
    legByes: number;
    byes: number;
    inningsNumber: number;
  } | null;
  totalOvers?: number;
  totalBalls?: number;
  targetRuns?: number;
  inningsNumber: number;
}

export function ScoreBoard({
  teamAName,
  teamBName,
  battingTeamId,
  teamAId,
  innings,
  totalOvers,
  totalBalls: totalBallsProp,
  targetRuns,
  inningsNumber,
}: ScoreBoardProps) {
  const battingTeamName = battingTeamId === teamAId ? teamAName : teamBName;
  const totalBalls = totalBallsProp !== undefined
    ? totalBallsProp
    : innings ? Math.round(innings.totalOvers * 6) : 0;
  const runRate = innings ? calcRunRate(innings.totalRuns, totalBalls) : '0.00';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cricket-green-500/15 via-cricket-green-500/8 to-transparent border border-cricket-green-500/20 p-5">
      {/* Subtle glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cricket-green-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative">
        <div className="mb-2 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-cricket-green-500 animate-pulse-soft" />
          <span className="text-sm font-medium text-muted-foreground">
            {battingTeamName} — Innings {inningsNumber}
          </span>
        </div>
        <div className="flex items-end gap-4">
          <span className="text-6xl font-black tabular-nums tracking-tight text-foreground leading-none">
            {innings ? `${innings.totalRuns}` : '0'}
            <span className="text-3xl text-muted-foreground font-bold">/{innings?.totalWickets ?? 0}</span>
          </span>
          <div className="mb-1.5 space-y-0.5">
            <div className="text-lg font-bold text-foreground/80">
              ({innings ? formatOvers(totalBalls) : '0.0'}{totalOvers ? ` / ${totalOvers}` : ''})
            </div>
            <div className="text-sm text-muted-foreground font-medium">RR: {runRate}</div>
          </div>
        </div>

        {targetRuns && inningsNumber >= 2 && (
          <div className="mt-3 rounded-xl bg-cricket-amber-500/10 border border-cricket-amber-500/20 px-4 py-2.5">
            <p className="text-sm font-bold text-cricket-amber">
              Target: {targetRuns} •{' '}
              Need {Math.max(0, targetRuns - (innings?.totalRuns ?? 0))} off{' '}
              {Math.max(0, (totalOvers ?? 20) * 6 - totalBalls)} balls
            </p>
          </div>
        )}

        {innings && (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground/70">
            <span>Extras <span className="font-semibold text-foreground/60">{innings.extras}</span></span>
            <span>Wd <span className="font-semibold text-foreground/60">{innings.wides}</span></span>
            <span>Nb <span className="font-semibold text-foreground/60">{innings.noBalls}</span></span>
            <span>Lb <span className="font-semibold text-foreground/60">{innings.legByes}</span></span>
            <span>B <span className="font-semibold text-foreground/60">{innings.byes}</span></span>
          </div>
        )}
      </div>
    </div>
  );
}
