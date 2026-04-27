import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getInitials, calcStrikeRate, calcBowlingEconomy } from '@/lib/utils';
import { Edit } from 'lucide-react';
import { BattingChart, BowlingChart } from '@/components/PlayerCharts';
import { getViewMode } from '@/lib/view-mode';

export default async function PlayerProfilePage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  // Resolve user's own player so we can redirect stale URLs
  const selfPlayer = await prisma.player.findFirst({
    where: { userId: session.user.id },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });

  const player = await prisma.player.findFirst({
    where: {
      id: params.id,
      userId: session.user.id,
    },
    include: {
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

  if (!player) {
    // Stale URL — redirect to user's actual self player or dashboard
    if (selfPlayer && selfPlayer.id !== params.id) {
      redirect(`/players/${selfPlayer.id}`);
    }
    redirect('/dashboard');
  }

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

  const isOrganizerView = getViewMode() === 'organizer';

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

  // Chart data (chronological order)
  const battingChartData = [...player.batterScores].reverse().map((bs, i) => ({
    matchLabel: `M${i + 1}`,
    runs: bs.runs,
    balls: bs.balls,
    sr: bs.balls > 0 ? parseFloat(((bs.runs / bs.balls) * 100).toFixed(1)) : 0,
  }));

  const bowlingChartData = [...player.bowlerScores].reverse().map((bs, i) => {
    const balls = Math.floor(bs.overs) * 6 + Math.round((bs.overs % 1) * 10);
    return {
      matchLabel: `M${i + 1}`,
      wickets: bs.wickets,
      runs: bs.runs,
      econ: balls > 0 ? parseFloat(((bs.runs / balls) * 6).toFixed(2)) : 0,
    };
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cricket-green/20 text-xl font-bold text-cricket-green">
            {getInitials(player.name)}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{player.name}</h1>
            {player.phone && <p className="text-muted-foreground">{player.phone}</p>}
            <p className="text-sm text-muted-foreground">
              {player.battingStyle} bat · {player.bowlingStyle} bowl
            </p>
          </div>
        </div>
        {!isOrganizerView && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/players/${player.id}/edit`}><Edit className="mr-2 h-4 w-4" />Edit</Link>
          </Button>
        )}
      </div>

      <Tabs defaultValue="batting">
        <TabsList>
          <TabsTrigger value="batting">Batting</TabsTrigger>
          <TabsTrigger value="bowling">Bowling</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
        </TabsList>

        <TabsContent value="batting">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {[
              { label: 'Matches', value: player.batterScores.length },
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

          <div className="mt-4 space-y-2">
            <h3 className="font-semibold">Recent Innings</h3>
            {player.batterScores.slice(0, 10).map((bs) => (
              <Card key={bs.id}>
                <CardContent className="flex items-center justify-between p-3">
                  <div>
                    <p className="text-sm font-medium">{bs.innings.match.teamA.name} vs {bs.innings.match.teamB.name}</p>
                    {bs.isOut && bs.dismissalType && (
                      <p className="text-xs text-muted-foreground">{bs.dismissalType}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-bold">{bs.runs}{!bs.isOut ? '*' : ''}</span>
                    <span className="text-sm text-muted-foreground"> ({bs.balls})</span>
                    <div className="text-xs text-muted-foreground">{bs.fours}×4 {bs.sixes}×6</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="bowling">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {[
              { label: 'Matches', value: player.bowlerScores.length },
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
        </TabsContent>

        <TabsContent value="charts">
          {battingChartData.length < 2 && bowlingChartData.length < 2 ? (
            <p className="py-8 text-center text-muted-foreground text-sm">Play at least 2 matches to see charts</p>
          ) : (
            <div className="space-y-8 mt-2">
              {battingChartData.length >= 2 && (
                <div>
                  <h3 className="font-semibold text-sm mb-1">Batting Trends</h3>
                  <BattingChart data={battingChartData} />
                </div>
              )}
              {bowlingChartData.length >= 2 && (
                <div>
                  <h3 className="font-semibold text-sm mb-1">Bowling Trends</h3>
                  <BowlingChart data={bowlingChartData} />
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
