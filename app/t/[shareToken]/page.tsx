import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import TournamentStatsClient from '@/app/(protected)/tournaments/[id]/TournamentStatsClient';

export default async function PublicTournamentPage({ params }: { params: { shareToken: string } }) {
  const tournament = await prisma.tournament.findUnique({
    where: { shareToken: params.shareToken },
    include: {
      teams: { include: { team: true } },
      matches: {
        include: {
          teamA: true,
          teamB: true,
          innings: {
            include: {
              batterScores: { include: { player: true } },
              bowlerScores: { include: { player: true } },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!tournament) notFound();

  // Points table with NRR
  const table: Record<string, { name: string; color: string; played: number; won: number; lost: number; tied: number; points: number; runsFor: number; oversFor: number; runsAgainst: number; oversAgainst: number }> = {};
  tournament.teams.forEach(({ team }) => {
    table[team.id] = { name: team.name, color: team.color, played: 0, won: 0, lost: 0, tied: 0, points: 0, runsFor: 0, oversFor: 0, runsAgainst: 0, oversAgainst: 0 };
  });
  tournament.matches.filter((m) => m.status === 'COMPLETED').forEach((match) => {
    const inn1 = match.innings.find((i) => i.inningsNumber === 1);
    const inn2 = match.innings.find((i) => i.inningsNumber === 2);
    if (!inn1 || !inn2) return;
    const ta = table[match.teamAId];
    const tb = table[match.teamBId];
    if (!ta || !tb) return;
    ta.played++; tb.played++;
    const teamARuns = inn1.battingTeamId === match.teamAId ? inn1.totalRuns : inn2.totalRuns;
    const teamBRuns = inn1.battingTeamId === match.teamBId ? inn1.totalRuns : inn2.totalRuns;
    if (teamARuns > teamBRuns) { ta.won++; ta.points += 2; tb.lost++; }
    else if (teamBRuns > teamARuns) { tb.won++; tb.points += 2; ta.lost++; }
    else { ta.tied++; ta.points++; tb.tied++; tb.points++; }
    const teamAInn = inn1.battingTeamId === match.teamAId ? inn1 : inn2;
    const teamBInn = inn1.battingTeamId === match.teamBId ? inn1 : inn2;
    ta.runsFor += teamAInn.totalRuns; ta.oversFor += (teamAInn as any).totalOvers ?? 0;
    ta.runsAgainst += teamBInn.totalRuns; ta.oversAgainst += (teamBInn as any).totalOvers ?? 0;
    tb.runsFor += teamBInn.totalRuns; tb.oversFor += (teamBInn as any).totalOvers ?? 0;
    tb.runsAgainst += teamAInn.totalRuns; tb.oversAgainst += (teamAInn as any).totalOvers ?? 0;
  });
  const calcNRR = (row: { runsFor: number; oversFor: number; runsAgainst: number; oversAgainst: number }) => {
    if (row.oversFor === 0 || row.oversAgainst === 0) return '+0.000';
    const nrr = (row.runsFor / row.oversFor) - (row.runsAgainst / row.oversAgainst);
    return (nrr >= 0 ? '+' : '') + nrr.toFixed(3);
  };
  const pointsTable = Object.entries(table).map(([id, row]) => ({ id, ...row, nrr: calcNRR(row) })).sort((a, b) => b.points - a.points || parseFloat(b.nrr) - parseFloat(a.nrr));

  // Stats aggregation (same logic as authenticated view)
  const batMap: Record<string, { name: string; matches: Set<string>; innings: number; runs: number; balls: number; fours: number; sixes: number; hs: number; notOuts: number; hundreds: number; fifties: number; nineties: number }> = {};
  const bowlMap: Record<string, { name: string; legalBalls: number; runs: number; wickets: number; maidens: number; matches: Set<string>; bestWickets: number; bestRuns: number; fiveWickets: number }> = {};

  tournament.matches.filter((m) => m.status === 'COMPLETED').forEach((m) => {
    m.innings.forEach((inn) => {
      inn.batterScores.forEach((bs) => {
        if (!batMap[bs.playerId]) batMap[bs.playerId] = { name: bs.player.name, matches: new Set(), innings: 0, runs: 0, balls: 0, fours: 0, sixes: 0, hs: 0, notOuts: 0, hundreds: 0, fifties: 0, nineties: 0 };
        const p = batMap[bs.playerId];
        p.matches.add(m.id); p.innings++; p.runs += bs.runs; p.balls += bs.balls; p.fours += bs.fours; p.sixes += bs.sixes;
        if (bs.runs > p.hs) p.hs = bs.runs;
        if (!bs.isOut) p.notOuts++;
        if (bs.runs >= 100) p.hundreds++; else if (bs.runs >= 50) p.fifties++;
        if (bs.runs >= 90 && bs.runs <= 99) p.nineties++;
      });
      inn.bowlerScores.forEach((bs) => {
        if (!bowlMap[bs.playerId]) bowlMap[bs.playerId] = { name: bs.player.name, legalBalls: 0, runs: 0, wickets: 0, maidens: 0, matches: new Set(), bestWickets: 0, bestRuns: 0, fiveWickets: 0 };
        const p = bowlMap[bs.playerId];
        p.matches.add(m.id);
        const co = Math.floor(bs.overs); const pb = Math.round((bs.overs - co) * 10);
        p.legalBalls += co * 6 + pb; p.runs += bs.runs; p.wickets += bs.wickets; p.maidens += bs.maidens;
        if (bs.wickets > p.bestWickets || (bs.wickets === p.bestWickets && bs.runs < p.bestRuns)) { p.bestWickets = bs.wickets; p.bestRuns = bs.runs; }
        if (bs.wickets >= 5) p.fiveWickets++;
      });
    });
  });

  const battingStats = Object.entries(batMap).map(([id, p]) => {
    const d = p.innings - p.notOuts;
    return { id, name: p.name, matches: p.matches.size, innings: p.innings, runs: p.runs, balls: p.balls, fours: p.fours, sixes: p.sixes, hs: p.hs, notOuts: p.notOuts, hundreds: p.hundreds, fifties: p.fifties, nineties: p.nineties, avg: d > 0 ? (p.runs / d).toFixed(2) : p.runs > 0 ? '–' : '0.00', sr: p.balls > 0 ? ((p.runs / p.balls) * 100).toFixed(2) : '0.00' };
  }).sort((a, b) => b.runs - a.runs);

  const bowlingStats = Object.entries(bowlMap).map(([id, p]) => {
    const overs = `${Math.floor(p.legalBalls / 6)}${p.legalBalls % 6 ? '.' + (p.legalBalls % 6) : ''}`;
    return { id, name: p.name, matches: p.matches.size, legalBalls: p.legalBalls, runs: p.runs, wickets: p.wickets, maidens: p.maidens, overs, econ: p.legalBalls > 0 ? ((p.runs / p.legalBalls) * 6).toFixed(2) : '0.00', avg: p.wickets > 0 ? (p.runs / p.wickets).toFixed(2) : '–', sr: p.wickets > 0 ? (p.legalBalls / p.wickets).toFixed(1) : '–', bestFigures: p.bestWickets > 0 ? `${p.bestWickets}/${p.bestRuns}` : '0/0', bestWickets: p.bestWickets, bestRuns: p.bestRuns, fiveWickets: p.fiveWickets };
  }).sort((a, b) => b.wickets - a.wickets || a.runs - b.runs);

  const liveMatches = tournament.matches.filter((m) => m.status === 'LIVE');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-4">
        <div className="mx-auto max-w-2xl flex items-center gap-3">
          <span className="text-3xl">🏏</span>
          <div>
            <h1 className="text-xl font-bold">{tournament.name}</h1>
            <p className="text-sm text-muted-foreground">{tournament.format} · {tournament.teams.length} teams</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl p-4 space-y-6">
        {/* Live matches */}
        {liveMatches.length > 0 && (
          <div>
            <h2 className="mb-3 font-semibold text-red-400 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse inline-block" />
              Live Now
            </h2>
            {liveMatches.map((m) => {
              const inn = m.innings.find((i) => !i.isCompleted) ?? m.innings[m.innings.length - 1];
              return (
                <Card key={m.id} className="border-red-500/30">
                  <CardContent className="p-4">
                    <p className="font-semibold">{m.teamA.name} vs {m.teamB.name}</p>
                    {inn && <p className="text-2xl font-black">{inn.totalRuns}/{inn.totalWickets}</p>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Tabs defaultValue="points">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="points">Points Table</TabsTrigger>
            <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="points">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground text-left">
                    <th className="pb-2 pr-4">Team</th>
                    <th className="pb-2 pr-3 text-right">P</th>
                    <th className="pb-2 pr-3 text-right">W</th>
                    <th className="pb-2 pr-3 text-right">L</th>
                    <th className="pb-2 pr-3 text-right">NRR</th>
                    <th className="pb-2 text-right font-bold">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {pointsTable.map((row, i) => (
                    <tr key={row.id} className={`border-b border-border/50 ${i === 0 ? 'bg-cricket-green/5' : ''}`}>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: row.color }} />
                          <span className="font-medium">{row.name}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-right text-muted-foreground">{row.played}</td>
                      <td className="py-3 pr-3 text-right text-green-400">{row.won}</td>
                      <td className="py-3 pr-3 text-right text-red-400">{row.lost}</td>
                      <td className={`py-3 pr-3 text-right text-xs font-mono ${row.nrr.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>{row.nrr}</td>
                      <td className="py-3 text-right font-black text-cricket-green">{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="fixtures">
            <div className="space-y-3">
              {tournament.matches.filter((m) => m.status === 'UPCOMING').map((m) => (
                <Card key={m.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <span className="font-medium">{m.teamA.name} vs {m.teamB.name}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(m.createdAt)}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="results">
            <div className="space-y-3">
              {tournament.matches.filter((m) => m.status === 'COMPLETED').map((m) => {
                const inn1 = m.innings.find((i) => i.inningsNumber === 1);
                const inn2 = m.innings.find((i) => i.inningsNumber === 2);
                return (
                  <Card key={m.id}>
                    <CardContent className="p-4">
                      <p className="font-semibold">{m.teamA.name} vs {m.teamB.name}</p>
                      {inn1 && inn2 && (
                        <p className="text-sm text-muted-foreground">
                          {m.teamA.name} {inn1.battingTeamId === m.teamAId ? `${inn1.totalRuns}/${inn1.totalWickets}` : `${inn2.totalRuns}/${inn2.totalWickets}`}
                          {' · '}
                          {m.teamB.name} {inn1.battingTeamId === m.teamBId ? `${inn1.totalRuns}/${inn1.totalWickets}` : `${inn2.totalRuns}/${inn2.totalWickets}`}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="stats">
            <TournamentStatsClient batting={battingStats} bowling={bowlingStats} />
          </TabsContent>
        </Tabs>

        <p className="text-center text-xs text-muted-foreground">
          Powered by <Link href="/" className="text-cricket-green hover:underline">CricScorer</Link>
        </p>
      </main>
    </div>
  );
}
