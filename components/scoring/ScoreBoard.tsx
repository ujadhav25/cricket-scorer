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
  totalBalls?: number; // override — pass actual legal delivery count to avoid float drift
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
    <div className="rounded-xl bg-cricket-green/10 border border-cricket-green/30 p-4">
      <div className="mb-1 text-sm font-medium text-muted-foreground">
        {battingTeamName} — Innings {inningsNumber}
      </div>
      <div className="flex items-end gap-3">
        <span className="text-5xl font-black tabular-nums text-foreground">
          {innings ? `${innings.totalRuns}/${innings.totalWickets}` : '0/0'}
        </span>
        <div className="mb-1 text-muted-foreground">
          <div className="text-lg font-semibold">
            ({innings ? formatOvers(totalBalls) : '0.0'}{totalOvers ? ` / ${totalOvers}` : ''} ov)
          </div>
          <div className="text-sm">RR: {runRate}</div>
        </div>
      </div>
      {targetRuns && inningsNumber >= 2 && (
        <div className="mt-2 text-sm font-semibold text-amber-400">
          Target: {targetRuns} •{' '}
          Need: {Math.max(0, targetRuns - (innings?.totalRuns ?? 0))} off{' '}
          {Math.max(0, (totalOvers ?? 20) * 6 - totalBalls)} balls
        </div>
      )}
      {innings && (
        <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
          <span>Extras: {innings.extras}</span>
          <span>Wd: {innings.wides}</span>
          <span>Nb: {innings.noBalls}</span>
          <span>Lb: {innings.legByes}</span>
          <span>B: {innings.byes}</span>
        </div>
      )}
    </div>
  );
}
