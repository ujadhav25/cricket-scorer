'use client';

interface MatchNode {
  id: string;
  teamAName: string;
  teamBName: string;
  teamAId: string;
  teamBId: string;
  status: string;
  innings: { inningsNumber: number; battingTeamId: string; totalRuns: number; totalWickets: number }[];
}

interface KnockoutBracketProps {
  matches: MatchNode[];
}

function getWinner(match: MatchNode): string | null {
  if (match.status !== 'COMPLETED') return null;
  const hasSO = match.innings.some((i) => i.inningsNumber >= 3);
  const inn1 = hasSO ? match.innings.find((i) => i.inningsNumber === 3) : match.innings.find((i) => i.inningsNumber === 1);
  const inn2 = hasSO ? match.innings.find((i) => i.inningsNumber === 4) : match.innings.find((i) => i.inningsNumber === 2);
  if (!inn1 || !inn2) return null;
  const aRuns = inn1.battingTeamId === match.teamAId ? inn1.totalRuns : inn2.totalRuns;
  const bRuns = inn1.battingTeamId === match.teamBId ? inn1.totalRuns : inn2.totalRuns;
  if (aRuns > bRuns) return match.teamAName;
  if (bRuns > aRuns) return match.teamBName;
  return null;
}

function getScore(match: MatchNode, teamId: string): string {
  const inn = match.innings.find((i) => i.battingTeamId === teamId && i.inningsNumber <= 2);
  if (!inn) return '—';
  return `${inn.totalRuns}/${inn.totalWickets}`;
}

function MatchCard({ match, round }: { match: MatchNode; round: string }) {
  const winner = getWinner(match);
  const scoreA = getScore(match, match.teamAId);
  const scoreB = getScore(match, match.teamBId);

  return (
    <div className="rounded-lg border border-border/50 bg-card/60 overflow-hidden w-48 shrink-0">
      <div className="px-2 py-1 bg-white/[0.03] border-b border-border/30">
        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{round}</p>
      </div>
      {[{ name: match.teamAName, score: scoreA, isWinner: winner === match.teamAName },
        { name: match.teamBName, score: scoreB, isWinner: winner === match.teamBName }].map((team, i) => (
        <div key={i} className={`flex items-center justify-between px-3 py-2 ${team.isWinner ? 'bg-cricket-green/10' : ''} ${i === 0 ? 'border-b border-border/20' : ''}`}>
          <span className={`text-xs font-semibold truncate max-w-[100px] ${team.isWinner ? 'text-cricket-green' : 'text-foreground/80'}`}>
            {team.name}
          </span>
          <span className={`text-xs font-bold ml-2 shrink-0 ${team.isWinner ? 'text-cricket-green' : 'text-muted-foreground'}`}>
            {match.status === 'UPCOMING' ? '—' : team.score}
          </span>
        </div>
      ))}
      {match.status === 'UPCOMING' && (
        <div className="px-3 py-1 bg-amber-500/5 border-t border-border/20">
          <p className="text-[10px] text-amber-400 font-medium">Upcoming</p>
        </div>
      )}
      {match.status === 'LIVE' && (
        <div className="px-3 py-1 bg-red-500/10 border-t border-border/20">
          <p className="text-[10px] text-red-400 font-semibold animate-pulse">● Live</p>
        </div>
      )}
    </div>
  );
}

function getRoundName(roundIndex: number, totalRounds: number): string {
  if (roundIndex === totalRounds - 1) return 'Final';
  if (roundIndex === totalRounds - 2) return 'Semi Final';
  if (roundIndex === totalRounds - 3) return 'Quarter Final';
  return `Round ${roundIndex + 1}`;
}

export function KnockoutBracket({ matches }: KnockoutBracketProps) {
  if (matches.length === 0) return null;

  // Arrange matches into rounds (powers of 2)
  const totalMatches = matches.length;
  const totalRounds = Math.ceil(Math.log2(totalMatches + 1));

  // Group by creation order into bracket rounds
  const rounds: MatchNode[][] = [];
  let remaining = [...matches];
  let size = Math.pow(2, totalRounds - 1);
  while (remaining.length > 0) {
    rounds.push(remaining.splice(0, size));
    size = Math.ceil(size / 2);
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-white/[0.02]">
        <h3 className="font-bold text-sm">Knockout Bracket</h3>
      </div>
      <div className="p-4 overflow-x-auto">
        <div className="flex gap-8 items-start min-w-max">
          {rounds.map((roundMatches, ri) => (
            <div key={ri} className="flex flex-col gap-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                {getRoundName(ri, rounds.length)}
              </p>
              {roundMatches.map((m) => (
                <MatchCard key={m.id} match={m} round={getRoundName(ri, rounds.length)} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
