import { adminAuth } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { getInitials, calcStrikeRate, calcBowlingEconomy, formatDate } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';

export default async function AdminPlayerDetailPage({ params }: { params: { id: string } }) {
  const session = await adminAuth();
  if (!(session as any)?.admin) redirect('/admin/login');

  const player = await prisma.player.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { name: true, email: true } },
      teamPlayers: {
        include: { team: { select: { id: true, name: true, color: true } } },
      },
      batterScores: {
        include: { innings: { include: { match: { include: { teamA: true, teamB: true } } } } },
        orderBy: { innings: { createdAt: 'desc' } },
      },
      bowlerScores: {
        include: { innings: { include: { match: { include: { teamA: true, teamB: true } } } } },
        orderBy: { innings: { createdAt: 'desc' } },
      },
    },
  });

  if (!player) notFound();

  // Batting stats
  const totalRuns = player.batterScores.reduce((s, b) => s + b.runs, 0);
  const totalBalls = player.batterScores.reduce((s, b) => s + b.balls, 0);
  const totalFours = player.batterScores.reduce((s, b) => s + b.fours, 0);
  const totalSixes = player.batterScores.reduce((s, b) => s + b.sixes, 0);
  const highScore = Math.max(0, ...player.batterScores.map((b) => b.runs));
  const highScoreNotOut = player.batterScores.some((b) => b.runs === highScore && !b.isOut);
  const fifties = player.batterScores.filter((b) => b.runs >= 50 && b.runs < 100).length;
  const hundreds = player.batterScores.filter((b) => b.runs >= 100).length;
  const notOuts = player.batterScores.filter((b) => !b.isOut).length;
  const dismissals = player.batterScores.length - notOuts;
  const battingAvg = dismissals > 0 ? (totalRuns / dismissals).toFixed(2) : totalRuns > 0 ? '∞' : '0.00';

  // Bowling stats
  const totalWickets = player.bowlerScores.reduce((s, b) => s + b.wickets, 0);
  const totalBowlingRuns = player.bowlerScores.reduce((s, b) => s + b.runs, 0);
  const totalBowlingBalls = player.bowlerScores.reduce((s, b) => s + b.balls, 0);
  const totalMaidens = player.bowlerScores.reduce((s, b) => s + b.maidens, 0);
  const bestFig = player.bowlerScores.reduce<{ w: number; r: number } | null>((best, b) => {
    if (!best) return { w: b.wickets, r: b.runs };
    if (b.wickets > best.w || (b.wickets === best.w && b.runs < best.r)) return { w: b.wickets, r: b.runs };
    return best;
  }, null);
  const bestBowling = bestFig ? `${bestFig.w}/${bestFig.r}` : '—';
  const bowlingAvg = totalWickets > 0 ? (totalBowlingRuns / totalWickets).toFixed(2) : '—';
  const fiveWickets = player.bowlerScores.filter((b) => b.wickets >= 5).length;

  return (
    <div className="p-6 space-y-6">
      {/* Back */}
      <Link href="/admin/players" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Players
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cricket-green/20 text-xl font-bold text-cricket-green shrink-0">
          {getInitials(player.name)}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{player.name}</h1>
          <p className="text-sm text-muted-foreground">{player.battingStyle} bat · {player.bowlingStyle} bowl</p>
          <p className="text-xs text-muted-foreground mt-0.5">Account: {player.user.name ?? player.user.email}</p>
          {player.phone && <p className="text-xs text-muted-foreground">{player.phone}</p>}
        </div>
      </div>

      {/* Teams */}
      {player.teamPlayers.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Teams</h2>
          <div className="flex flex-wrap gap-2">
            {player.teamPlayers.map((tp) => (
              <span key={tp.teamId} className="text-xs px-2.5 py-1 rounded-full border border-border/40 font-medium" style={{ color: tp.team.color }}>
                {tp.team.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Batting Stats */}
      <div>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Batting</h2>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {[
            { label: 'Innings', value: player.batterScores.length },
            { label: 'Runs', value: totalRuns },
            { label: 'Avg', value: battingAvg },
            { label: 'SR', value: calcStrikeRate(totalRuns, totalBalls) },
            { label: 'HS', value: `${highScore}${highScoreNotOut ? '*' : ''}` },
            { label: 'NO', value: notOuts },
            { label: '50s', value: fifties },
            { label: '100s', value: hundreds },
            { label: '4s', value: totalFours },
            { label: '6s', value: totalSixes },
          ].map(({ label, value }) => (
            <Card key={label}>
              <CardContent className="p-3 text-center">
                <div className="text-xl font-black text-cricket-green">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Bowling Stats */}
      <div>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Bowling</h2>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {[
            { label: 'Innings', value: player.bowlerScores.length },
            { label: 'Wickets', value: totalWickets },
            { label: 'Economy', value: calcBowlingEconomy(totalBowlingRuns, totalBowlingBalls) },
            { label: 'Avg', value: bowlingAvg },
            { label: 'Runs', value: totalBowlingRuns },
            { label: 'Maidens', value: totalMaidens },
            { label: 'Best', value: bestBowling },
            { label: '5W', value: fiveWickets },
          ].map(({ label, value }) => (
            <Card key={label}>
              <CardContent className="p-3 text-center">
                <div className="text-xl font-black text-cricket-green">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Batting Innings */}
      {player.batterScores.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Recent Batting Innings</h2>
          <div className="space-y-2">
            {player.batterScores.slice(0, 15).map((bs) => (
              <Card key={bs.id}>
                <CardContent className="flex items-center justify-between p-3">
                  <div>
                    <p className="text-sm font-medium">
                      {bs.innings.match.teamA.name} vs {bs.innings.match.teamB.name}
                    </p>
                    {bs.isOut && bs.dismissalType && (
                      <p className="text-xs text-muted-foreground">{bs.dismissalType}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{formatDate(bs.innings.createdAt.toISOString())}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-cricket-green">{bs.runs}{!bs.isOut ? '*' : ''}</span>
                    <span className="text-sm text-muted-foreground"> ({bs.balls}b)</span>
                    <div className="text-xs text-muted-foreground">{bs.fours}×4 {bs.sixes}×6</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recent Bowling */}
      {player.bowlerScores.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Recent Bowling</h2>
          <div className="space-y-2">
            {player.bowlerScores.slice(0, 10).map((bs) => (
              <Card key={bs.id}>
                <CardContent className="flex items-center justify-between p-3">
                  <div>
                    <p className="text-sm font-medium">
                      {bs.innings.match.teamA.name} vs {bs.innings.match.teamB.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(bs.innings.createdAt.toISOString())}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-cricket-green">{bs.wickets}/{bs.runs}</span>
                    <div className="text-xs text-muted-foreground">{bs.overs} ov · {bs.maidens} md</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
