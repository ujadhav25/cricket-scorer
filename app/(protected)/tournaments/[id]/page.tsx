import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate } from '@/lib/utils';
import { Edit, Zap } from 'lucide-react';
import TournamentStatsClient from './TournamentStatsClient';
import DeleteTournamentButton from './DeleteTournamentButton';
import { ShareTournamentButton } from '@/components/ShareTournamentButton';
import { TournamentJoinButton } from '@/components/TournamentJoinButton';
import { GenerateFixturesButton } from './GenerateFixturesButton';
import { KnockoutBracket } from './KnockoutBracket';
import { GroupStageManager } from './GroupStageManager';

export default async function TournamentDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const tournament = await prisma.tournament.findFirst({
    where: {
      id: params.id,
      OR: [
        { userId: session.user.id },
        { teams: { some: { team: { players: { some: { player: { userId: session.user.id } } } } } } },
      ],
    },
    include: {
      teams: { include: { team: true } },
      groups: { include: { teams: { include: { team: true } } }, orderBy: { groupOrder: 'asc' } },
      matches: {
        include: {
          teamA: true, teamB: true,
          innings: {
            select: {
              totalRuns: true, totalWickets: true, inningsNumber: true, battingTeamId: true, totalOvers: true, isCompleted: true,
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

  // Build points table (works for all formats)
  const table: Record<string, { name: string; color: string; played: number; won: number; lost: number; tied: number; points: number; runsFor: number; oversFor: number; runsAgainst: number; oversAgainst: number }> = {};
  tournament.teams.forEach(({ team }) => {
    table[team.id] = { name: team.name, color: team.color, played: 0, won: 0, lost: 0, tied: 0, points: 0, runsFor: 0, oversFor: 0, runsAgainst: 0, oversAgainst: 0 };
  });

  tournament.matches.filter((m) => m.status === 'COMPLETED').forEach((match) => {
    // Use super over result if played, else regular innings
    const hasSuperOver = match.innings.some((i) => i.inningsNumber >= 3);
    const inn1 = hasSuperOver
      ? match.innings.find((i) => i.inningsNumber === 3)
      : match.innings.find((i) => i.inningsNumber === 1);
    const inn2 = hasSuperOver
      ? match.innings.find((i) => i.inningsNumber === 4)
      : match.innings.find((i) => i.inningsNumber === 2);
    if (!inn1 || !inn2) return;
    const ta = table[match.teamAId];
    const tb = table[match.teamBId];
    if (!ta || !tb) return;
    ta.played++; tb.played++;
    const ri1 = match.innings.find((i) => i.inningsNumber === 1);
    const ri2 = match.innings.find((i) => i.inningsNumber === 2);
    const teamARuns = inn1.battingTeamId === match.teamAId ? inn1.totalRuns : inn2.totalRuns;
    const teamBRuns = inn1.battingTeamId === match.teamBId ? inn1.totalRuns : inn2.totalRuns;
    if (teamARuns > teamBRuns) { ta.won++; ta.points += 2; tb.lost++; }
    else if (teamBRuns > teamARuns) { tb.won++; tb.points += 2; ta.lost++; }
    else { ta.tied++; ta.points++; tb.tied++; tb.points++; }
    // NRR — use regular innings overs
    if (ri1 && ri2) {
      const teamABattedInn = ri1.battingTeamId === match.teamAId ? ri1 : ri2;
      const teamBBattedInn = ri1.battingTeamId === match.teamBId ? ri1 : ri2;
      ta.runsFor += teamABattedInn.totalRuns; ta.oversFor += teamABattedInn.totalOvers;
      ta.runsAgainst += teamBBattedInn.totalRuns; ta.oversAgainst += teamBBattedInn.totalOvers;
      tb.runsFor += teamBBattedInn.totalRuns; tb.oversFor += teamBBattedInn.totalOvers;
      tb.runsAgainst += teamABattedInn.totalRuns; tb.oversAgainst += teamABattedInn.totalOvers;
    }
  });

  const calcNRR = (row: { runsFor: number; oversFor: number; runsAgainst: number; oversAgainst: number }) => {
    if (row.oversFor === 0 || row.oversAgainst === 0) return '+0.000';
    const nrr = (row.runsFor / row.oversFor) - (row.runsAgainst / row.oversAgainst);
    return (nrr >= 0 ? '+' : '') + nrr.toFixed(3);
  };

  const pointsTable = Object.entries(table).map(([id, row]) => ({ id, ...row, nrr: calcNRR(row) })).sort((a, b) => b.points - a.points || parseFloat(b.nrr) - parseFloat(a.nrr));

  const isBilateral = tournament.format === 'BILATERAL';

  // ── Tournament Stats ──────────────────────────────────────────────────
  const battingMap: Record<string, { name: string; matches: Set<string>; innings: number; runs: number; balls: number; fours: number; sixes: number; hs: number; notOuts: number; hundreds: number; fifties: number; nineties: number }> = {};
  const bowlingMap: Record<string, { name: string; legalBalls: number; runs: number; wickets: number; maidens: number; matches: Set<string>; bestWickets: number; bestRuns: number; fiveWickets: number }> = {};

  tournament.matches.filter((m) => m.status === 'COMPLETED').forEach((m) => {
    m.innings.forEach((inn) => {
      inn.batterScores.forEach((bs) => {
        if (!battingMap[bs.playerId]) {
          battingMap[bs.playerId] = { name: bs.player.name, matches: new Set(), innings: 0, runs: 0, balls: 0, fours: 0, sixes: 0, hs: 0, notOuts: 0, hundreds: 0, fifties: 0, nineties: 0 };
        }
        const p = battingMap[bs.playerId];
        p.matches.add(m.id);
        p.innings++;
        p.runs += bs.runs;
        p.balls += bs.balls;
        p.fours += bs.fours;
        p.sixes += bs.sixes;
        if (bs.runs > p.hs) p.hs = bs.runs;
        if (!bs.isOut) p.notOuts++;
        if (bs.runs >= 100) p.hundreds++;
        else if (bs.runs >= 50) p.fifties++;
        if (bs.runs >= 90 && bs.runs <= 99) p.nineties++;
      });
      inn.bowlerScores.forEach((bs) => {
        if (!bowlingMap[bs.playerId]) {
          bowlingMap[bs.playerId] = { name: bs.player.name, legalBalls: 0, runs: 0, wickets: 0, maidens: 0, matches: new Set(), bestWickets: 0, bestRuns: 0, fiveWickets: 0 };
        }
        const p = bowlingMap[bs.playerId];
        p.matches.add(m.id);
        const completedOvers = Math.floor(bs.overs);
        const partialBalls = Math.round((bs.overs - completedOvers) * 10);
        p.legalBalls += completedOvers * 6 + partialBalls;
        p.runs += bs.runs;
        p.wickets += bs.wickets;
        p.maidens += bs.maidens;
        if (bs.wickets > p.bestWickets || (bs.wickets === p.bestWickets && bs.runs < p.bestRuns)) {
          p.bestWickets = bs.wickets;
          p.bestRuns = bs.runs;
        }
        if (bs.wickets >= 5) p.fiveWickets++;
      });
    });
  });

  const battingStats = Object.entries(battingMap)
    .map(([id, p]) => {
      const dismissals = p.innings - p.notOuts;
      const avg = dismissals > 0 ? (p.runs / dismissals).toFixed(2) : p.runs > 0 ? '–' : '0.00';
      const sr = p.balls > 0 ? ((p.runs / p.balls) * 100).toFixed(2) : '0.00';
      return { id, name: p.name, matches: p.matches.size, innings: p.innings, runs: p.runs, balls: p.balls, fours: p.fours, sixes: p.sixes, hs: p.hs, notOuts: p.notOuts, hundreds: p.hundreds, fifties: p.fifties, nineties: p.nineties, avg, sr };
    })
    .sort((a, b) => b.runs - a.runs);

  const bowlingStats = Object.entries(bowlingMap)
    .map(([id, p]) => {
      const overs = `${Math.floor(p.legalBalls / 6)}${p.legalBalls % 6 ? '.' + (p.legalBalls % 6) : ''}`;
      const econ = p.legalBalls > 0 ? ((p.runs / p.legalBalls) * 6).toFixed(2) : '0.00';
      const avg = p.wickets > 0 ? (p.runs / p.wickets).toFixed(2) : '–';
      const sr = p.wickets > 0 ? (p.legalBalls / p.wickets).toFixed(1) : '–';
      const bestFigures = p.bestWickets > 0 ? `${p.bestWickets}/${p.bestRuns}` : '0/0';
      return { id, name: p.name, matches: p.matches.size, legalBalls: p.legalBalls, runs: p.runs, wickets: p.wickets, maidens: p.maidens, overs, econ, avg, sr, bestFigures, bestWickets: p.bestWickets, bestRuns: p.bestRuns, fiveWickets: p.fiveWickets };
    })
    .sort((a, b) => b.wickets - a.wickets || a.runs - b.runs);

  const shareUrl = `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/t/${tournament.shareToken}`;

  const upcoming = tournament.matches.filter((m) => m.status === 'UPCOMING');
  const completed = tournament.matches.filter((m) => m.status === 'COMPLETED');

  // Bilateral series winner — team with most wins
  const bilateralWinner = isBilateral && completed.length > 0
    ? (pointsTable[0]?.won > (pointsTable[1]?.won ?? 0) ? pointsTable[0].name : null)
    : null;

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold leading-tight">{tournament.name}</h1>
            <p className="text-sm text-muted-foreground">
              {isBilateral ? 'Bilateral Series' : tournament.format} · {tournament.teams.length} teams
              {isBilateral && (tournament as any).totalMatches ? ` · ${(tournament as any).totalMatches} matches` : ''}
            </p>
            {bilateralWinner && (
              <p className="text-sm font-semibold text-yellow-400 mt-1">🏆 {bilateralWinner} leads the series</p>
            )}
            {tournament.startDate && <p className="text-sm text-muted-foreground">Starts: {formatDate(tournament.startDate)}</p>}
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href={`/tournaments/${tournament.id}/edit`}><Edit className="h-4 w-4" /></Link>
          </Button>
        </div>
        {/* Action buttons row */}
        <div className="flex flex-wrap gap-2">
          <TournamentJoinButton joinToken={tournament.joinToken} tournamentName={tournament.name} />
          <ShareTournamentButton shareToken={tournament.shareToken} tournamentName={tournament.name} />
          <GenerateFixturesButton tournamentId={tournament.id} teamCount={tournament.teams.length} matchCount={upcoming.length + completed.length} format={tournament.format} />
          <DeleteTournamentButton tournamentId={tournament.id} />
        </div>
      </div>

      <Tabs defaultValue="points">
        <TabsList className="flex w-full overflow-x-auto gap-0 h-auto p-1 justify-start">
          <TabsTrigger value="points" className="shrink-0 text-xs px-3 py-1.5">{isBilateral ? 'Series' : 'Points'}</TabsTrigger>
          <TabsTrigger value="upcoming" className="shrink-0 text-xs px-3 py-1.5">Upcoming</TabsTrigger>
          <TabsTrigger value="results" className="shrink-0 text-xs px-3 py-1.5">Results</TabsTrigger>
          <TabsTrigger value="groups" className="shrink-0 text-xs px-3 py-1.5">Groups</TabsTrigger>
          <TabsTrigger value="caps" className="shrink-0 text-xs px-3 py-1.5">🧢 Caps</TabsTrigger>
          <TabsTrigger value="stats" className="shrink-0 text-xs px-3 py-1.5">Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="points">
          {isBilateral ? (
            /* Bilateral: show large head-to-head score card */
            <div className="mt-4 space-y-4">
              {pointsTable.length === 2 && (
                <div className="rounded-xl border border-border bg-card p-6 text-center">
                  <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider">Series Score</p>
                  <div className="flex items-center justify-center gap-6">
                    {pointsTable.map((row, i) => (
                      <div key={row.id} className="flex-1">
                        <div className="h-2 w-2 rounded-full mx-auto mb-2" style={{ backgroundColor: row.color }} />
                        <p className="text-sm font-medium text-muted-foreground">{row.name}</p>
                        <p className={`text-5xl font-black mt-1 ${bilateralWinner === row.name ? 'text-yellow-400' : ''}`}>{row.won}</p>
                        <p className="text-xs text-muted-foreground mt-1">{row.tied > 0 ? `${row.tied} tied` : ''}</p>
                        {bilateralWinner === row.name && <p className="text-xs font-bold text-yellow-400 mt-1">🏆 Leading</p>}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    {completed.length} of {(tournament as any).totalMatches ?? '?'} matches played
                  </p>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="pb-2 pr-4">Team</th>
                      <th className="pb-2 pr-3 text-right">P</th>
                      <th className="pb-2 pr-3 text-right">W</th>
                      <th className="pb-2 pr-3 text-right">L</th>
                      <th className="pb-2 pr-3 text-right">T</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pointsTable.map((row) => (
                      <tr key={row.id} className="border-b border-border/50">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: row.color }} />
                            <span className="font-medium">{row.name}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-3 text-right text-muted-foreground">{row.played}</td>
                        <td className="py-3 pr-3 text-right text-green-400 font-bold">{row.won}</td>
                        <td className="py-3 pr-3 text-right text-red-400">{row.lost}</td>
                        <td className="py-3 pr-3 text-right text-amber-400">{row.tied}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-2">Team</th>
                    <th className="pb-2 px-1 text-right">P</th>
                    <th className="pb-2 px-1 text-right">W</th>
                    <th className="pb-2 px-1 text-right">L</th>
                    <th className="pb-2 px-1 text-right">T</th>
                    <th className="pb-2 px-1 text-right">NRR</th>
                    <th className="pb-2 pl-1 text-right font-bold">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {pointsTable.map((row, i) => (
                    <tr key={row.id} className={`border-b border-border/50 ${i === 0 ? 'bg-cricket-green/5' : ''}`}>
                      <td className="py-2.5 pr-2">
                        <div className="flex items-center gap-1.5">
                          <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
                          <span className="font-medium truncate max-w-[90px] sm:max-w-none">{row.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-1 text-right text-muted-foreground">{row.played}</td>
                      <td className="py-2.5 px-1 text-right text-green-400">{row.won}</td>
                      <td className="py-2.5 px-1 text-right text-red-400">{row.lost}</td>
                      <td className="py-2.5 px-1 text-right text-amber-400">{row.tied}</td>
                      <td className={`py-2.5 px-1 text-right text-xs font-mono ${row.nrr.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>{row.nrr}</td>
                      <td className="py-2.5 pl-1 text-right font-black text-cricket-green">{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="upcoming">
          {upcoming.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No upcoming matches</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((m, idx) => {
                const isNext = idx === 0; // only the first upcoming match is playable
                return (
                  <Link key={m.id} href={`/matches/${m.id}`}>
                    <Card className={isNext ? 'hover:border-cricket-green/40 transition-colors' : 'opacity-50 cursor-not-allowed pointer-events-none'}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <span>{m.teamA.name} vs {m.teamB.name}</span>
                          {!isNext && <p className="text-xs text-muted-foreground mt-0.5">Locked — complete previous match first</p>}
                        </div>
                        <Button
                          asChild={isNext}
                          size="sm"
                          className="bg-cricket-green hover:bg-cricket-green/90"
                          disabled={!isNext}
                        >
                          {isNext ? <Link href={`/matches/${m.id}/score`}>Score</Link> : <span>Score</span>}
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="results">
          {completed.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No completed matches</p>
          ) : (
            <div className="space-y-3 mt-4">
              {completed.map((m) => {
                const hasSuperOver = m.innings.some((i) => i.inningsNumber >= 3);
                const inn1 = hasSuperOver ? m.innings.find((i) => i.inningsNumber === 3) : m.innings.find((i) => i.inningsNumber === 1);
                const inn2 = hasSuperOver ? m.innings.find((i) => i.inningsNumber === 4) : m.innings.find((i) => i.inningsNumber === 2);

                // Determine winner
                let winnerId: string | null = null;
                if (inn1 && inn2) {
                  const runsA = inn1.battingTeamId === m.teamAId ? inn1.totalRuns : inn2.totalRuns;
                  const runsB = inn1.battingTeamId === m.teamBId ? inn1.totalRuns : inn2.totalRuns;
                  if (runsA > runsB) winnerId = m.teamAId;
                  else if (runsB > runsA) winnerId = m.teamBId;
                }

                // Score display (always show regular innings 1 & 2 for context)
                const regInn1 = m.innings.find((i) => i.inningsNumber === 1);
                const regInn2 = m.innings.find((i) => i.inningsNumber === 2);

                return (
                  <Link key={m.id} href={`/matches/${m.id}`}>
                    <Card className="hover:border-cricket-green/40 transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{m.teamA.name} vs {m.teamB.name}</p>
                            {regInn1 && regInn2 && (
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {m.teamA.name}: {regInn1.battingTeamId === m.teamAId ? `${regInn1.totalRuns}/${regInn1.totalWickets}` : `${regInn2.totalRuns}/${regInn2.totalWickets}`}
                                &nbsp;·&nbsp;
                                {m.teamB.name}: {regInn1.battingTeamId === m.teamBId ? `${regInn1.totalRuns}/${regInn1.totalWickets}` : `${regInn2.totalRuns}/${regInn2.totalWickets}`}
                                {hasSuperOver && <span className="ml-2 text-xs text-amber-400">(Super Over)</span>}
                              </p>
                            )}
                          </div>
                          <div className="shrink-0 text-right">
                            {winnerId ? (
                              <span className="inline-block rounded-full bg-cricket-green/20 px-2 py-0.5 text-xs font-semibold text-cricket-green">
                                {winnerId === m.teamAId ? m.teamA.name : m.teamB.name} won
                              </span>
                            ) : inn1 && inn2 ? (
                              <span className="inline-block rounded-full bg-amber-400/20 px-2 py-0.5 text-xs font-semibold text-amber-400">Tie</span>
                            ) : null}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </TabsContent>
        <TabsContent value="stats">
          <TournamentStatsClient batting={battingStats} bowling={bowlingStats} />
        </TabsContent>

        <TabsContent value="groups">
          <GroupStageManager
            tournamentId={tournament.id}
            isOwner={tournament.userId === session.user.id}
            allTeams={tournament.teams.map((t) => ({ id: t.team.id, name: t.team.name }))}
            groups={(tournament as any).groups ?? []}
          />
        </TabsContent>

        <TabsContent value="caps">
          <div className="mt-4 space-y-6">
            {/* Orange Cap — Top Scorer */}
            <div className="rounded-xl border border-orange-500/30 bg-orange-500/[0.04] overflow-hidden">
              <div className="px-4 py-3 border-b border-orange-500/20 flex items-center gap-2">
                <span className="text-lg">🧡</span>
                <h3 className="font-bold text-orange-400">Orange Cap — Top Run Scorers</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30 text-left text-xs text-muted-foreground">
                      <th className="px-4 py-2">#</th>
                      <th className="px-2 py-2">Player</th>
                      <th className="px-2 py-2 text-right">M</th>
                      <th className="px-2 py-2 text-right">Inn</th>
                      <th className="px-2 py-2 text-right font-bold text-orange-400">Runs</th>
                      <th className="px-2 py-2 text-right">HS</th>
                      <th className="px-2 py-2 text-right">Avg</th>
                      <th className="px-2 py-2 text-right">SR</th>
                      <th className="pr-4 py-2 text-right">6s</th>
                    </tr>
                  </thead>
                  <tbody>
                    {battingStats.slice(0, 10).map((p, i) => (
                      <tr key={p.id} className={`border-b border-border/20 ${i === 0 ? 'bg-orange-500/10' : ''}`}>
                        <td className="px-4 py-2.5 font-bold text-muted-foreground">{i + 1}</td>
                        <td className="px-2 py-2.5">
                          <div className="flex items-center gap-2">
                            {i === 0 && <span className="text-base">🧡</span>}
                            <Link href={`/players/${p.id}`} className="font-semibold hover:text-orange-400 transition-colors">{p.name}</Link>
                          </div>
                        </td>
                        <td className="px-2 py-2.5 text-right text-muted-foreground">{p.matches}</td>
                        <td className="px-2 py-2.5 text-right text-muted-foreground">{p.innings}</td>
                        <td className={`px-2 py-2.5 text-right font-black ${i === 0 ? 'text-orange-400' : ''}`}>{p.runs}</td>
                        <td className="px-2 py-2.5 text-right text-muted-foreground">{p.hs}</td>
                        <td className="px-2 py-2.5 text-right text-muted-foreground">{p.avg}</td>
                        <td className="px-2 py-2.5 text-right text-muted-foreground">{p.sr}</td>
                        <td className="pr-4 py-2.5 text-right text-muted-foreground">{p.sixes}</td>
                      </tr>
                    ))}
                    {battingStats.length === 0 && (
                      <tr><td colSpan={9} className="px-4 py-6 text-center text-muted-foreground">No batting data yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Purple Cap — Top Wicket Taker */}
            <div className="rounded-xl border border-purple-500/30 bg-purple-500/[0.04] overflow-hidden">
              <div className="px-4 py-3 border-b border-purple-500/20 flex items-center gap-2">
                <span className="text-lg">💜</span>
                <h3 className="font-bold text-purple-400">Purple Cap — Top Wicket Takers</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30 text-left text-xs text-muted-foreground">
                      <th className="px-4 py-2">#</th>
                      <th className="px-2 py-2">Player</th>
                      <th className="px-2 py-2 text-right">M</th>
                      <th className="px-2 py-2 text-right">O</th>
                      <th className="px-2 py-2 text-right font-bold text-purple-400">Wkts</th>
                      <th className="px-2 py-2 text-right">Best</th>
                      <th className="px-2 py-2 text-right">Avg</th>
                      <th className="pr-4 py-2 text-right">Econ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bowlingStats.slice(0, 10).map((p, i) => (
                      <tr key={p.id} className={`border-b border-border/20 ${i === 0 ? 'bg-purple-500/10' : ''}`}>
                        <td className="px-4 py-2.5 font-bold text-muted-foreground">{i + 1}</td>
                        <td className="px-2 py-2.5">
                          <div className="flex items-center gap-2">
                            {i === 0 && <span className="text-base">💜</span>}
                            <Link href={`/players/${p.id}`} className="font-semibold hover:text-purple-400 transition-colors">{p.name}</Link>
                          </div>
                        </td>
                        <td className="px-2 py-2.5 text-right text-muted-foreground">{p.matches}</td>
                        <td className="px-2 py-2.5 text-right text-muted-foreground">{p.overs}</td>
                        <td className={`px-2 py-2.5 text-right font-black ${i === 0 ? 'text-purple-400' : ''}`}>{p.wickets}</td>
                        <td className="px-2 py-2.5 text-right text-muted-foreground">{p.bestFigures}</td>
                        <td className="px-2 py-2.5 text-right text-muted-foreground">{p.avg}</td>
                        <td className="pr-4 py-2.5 text-right text-muted-foreground">{p.econ}</td>
                      </tr>
                    ))}
                    {bowlingStats.length === 0 && (
                      <tr><td colSpan={8} className="px-4 py-6 text-center text-muted-foreground">No bowling data yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Knockout Bracket for KNOCKOUT/GROUP_KNOCKOUT */}
            {(tournament.format === 'KNOCKOUT' || tournament.format === 'GROUP_KNOCKOUT') && completed.length > 0 && (
              <KnockoutBracket matches={[...completed, ...upcoming].map((m) => ({
                id: m.id,
                teamAName: m.teamA.name,
                teamBName: m.teamB.name,
                status: m.status,
                innings: m.innings.map((i) => ({ inningsNumber: i.inningsNumber, battingTeamId: i.battingTeamId, totalRuns: i.totalRuns, totalWickets: i.totalWickets })),
                teamAId: m.teamAId,
                teamBId: m.teamBId,
              }))} />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
