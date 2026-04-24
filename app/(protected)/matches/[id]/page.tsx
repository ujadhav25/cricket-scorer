import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate, calcStrikeRate, calcBowlingEconomy, formatOvers, legalBallCount, legalBallCountForBowler } from '@/lib/utils';
import { Activity, Edit, Star } from 'lucide-react';
import DeleteMatchButton from './DeleteMatchButton';
import { FireworksAnim } from '@/components/animations/FireworksAnim';
import { ShareMatchButton } from '@/components/ShareMatchButton';
import { MatchCharts } from '@/components/MatchCharts';
import { PushSubscribeButton } from '@/components/PushSubscribeButton';
import { CastButton } from '@/components/CastButton';
import { MotmPicker } from '@/components/MotmPicker';

export default async function MatchDetailPage({ params }: { params: { id: string } }) {
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
      tournament: { select: { name: true, id: true } },
      motmPlayer: { select: { id: true, name: true } },
      innings: {
        include: {
          batterScores: { include: { player: true }, orderBy: { battingOrder: 'asc' } },
          bowlerScores: { include: { player: true } },
          battingTeam: true,
          deliveries: { 
            select: { overNumber: true, ballNumber: true, isWide: true, isNoBall: true, isLegBye: true, isBye: true, bowlerId: true, isWicket: true, batsmanId: true, runs: true, wicketType: true, fielderId: true },
            orderBy: [{ overNumber: 'asc' }, { ballNumber: 'asc' }]
          },
          partnerships: { orderBy: { id: 'asc' } },
        },
        orderBy: { inningsNumber: 'asc' },
      },
    },
  });

  if (!match) notFound();

  // Determine winner and the SINGLE decisive innings number
  let winnerName: string | undefined;
  let decisiveInningsNumber: number | null = null;
  if (match.status === 'COMPLETED' && match.innings.length >= 2) {
    const inn1 = match.innings.find((i: any) => i.inningsNumber === 1);
    const inn2 = match.innings.find((i: any) => i.inningsNumber === 2);
    const inn3 = match.innings.find((i: any) => i.inningsNumber === 3);
    const inn4 = match.innings.find((i: any) => i.inningsNumber === 4);

    const teamName = (battingTeamId: string) =>
      battingTeamId === match.teamAId ? match.teamA.name : match.teamB.name;

    // If super over was played, use super over scores
    if (inn3 && inn4) {
      if (inn4.totalRuns > inn3.totalRuns) {
        winnerName = teamName(inn4.battingTeamId); decisiveInningsNumber = 4;
      } else if (inn3.totalRuns > inn4.totalRuns) {
        winnerName = teamName(inn3.battingTeamId); decisiveInningsNumber = 3;
      }
    } else if (inn1 && inn2) {
      if (inn2.totalRuns > inn1.totalRuns) {
        winnerName = teamName(inn2.battingTeamId); decisiveInningsNumber = 2;
      } else if (inn1.totalRuns > inn2.totalRuns) {
        winnerName = teamName(inn1.battingTeamId); decisiveInningsNumber = 1;
      }
    }
  }

  // Build a unified player map for commentary (batsmen + bowlers across all innings)
  const allPlayerMap: Record<string, string> = {};
  match.innings.forEach((inn) => {
    inn.batterScores.forEach((bs) => { allPlayerMap[bs.playerId] = bs.player.name; });
    inn.bowlerScores.forEach((bs) => { allPlayerMap[bs.playerId] = bs.player.name; });
  });

  // All players across both teams for MOTM picker
  const allMatchPlayers = Object.entries(allPlayerMap).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto">
      {match.status === 'COMPLETED' && <FireworksAnim winnerName={winnerName} matchId={match.id} />}

      {/* ── Header ── */}
      <div className="space-y-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs mb-1">
            {match.tournament && <span className="text-amber-400 font-medium">{match.tournament.name}</span>}
            <span>{formatDate(match.createdAt)}</span>
            {match.venue && <span>· {match.venue}</span>}
          </div>
          <h1 className="text-lg font-bold leading-snug">{match.teamA.name} vs {match.teamB.name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              match.status === 'LIVE' ? 'bg-red-500 text-white animate-pulse' :
              match.status === 'COMPLETED' ? 'bg-green-700 text-white' : 'bg-muted text-muted-foreground'}`}>
              {match.status}
            </span>
            {winnerName && <span className="text-xs font-semibold text-yellow-400">🏆 {winnerName} won</span>}
          </div>
          {match.tossWinner && (
            <p className="text-xs text-muted-foreground mt-1">
              🪙 {match.tossWinner === match.teamAId ? match.teamA.name : match.teamB.name} won toss · elected to {match.tossDecision}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {match.status !== 'COMPLETED' && match.userId === session.user.id && (
            <Button asChild size="sm" className="bg-cricket-green hover:bg-cricket-green/90">
              <Link href={`/matches/${match.id}/score`}><Activity className="mr-1.5 h-4 w-4" />Score</Link>
            </Button>
          )}
          {match.userId === session.user.id && (
            <Button asChild size="sm" variant="outline">
              <Link href={`/matches/${match.id}/edit`}><Edit className="mr-1.5 h-4 w-4" />Edit</Link>
            </Button>
          )}
          <CastButton matchId={match.id} />
          <PushSubscribeButton matchId={match.id} />
          <ShareMatchButton shareToken={match.shareToken} matchTitle={`${match.teamA.name} vs ${match.teamB.name}`} />
          {match.userId === session.user.id && <DeleteMatchButton matchId={match.id} />}
        </div>
      </div>

      {/* ── Score Summary Cards ── */}
      <div className="grid grid-cols-2 gap-3">
        {match.innings.map((inn) => {
          const isWinner = winnerName && inn.inningsNumber === decisiveInningsNumber;
          const isTeamA = inn.battingTeamId === match.teamAId;
          return (
            <div key={inn.id} className={[
              'rounded-xl border p-4 relative overflow-hidden',
              isTeamA ? 'border-blue-500/40 bg-blue-950/20' : 'border-rose-500/40 bg-rose-950/20',
              isWinner ? 'ring-2 ring-yellow-400 shadow-[0_0_20px_4px_rgba(250,204,21,0.25)]' : '',
            ].join(' ')}>
              <div className={['absolute inset-x-0 top-0 h-1 rounded-t-xl', isTeamA ? 'bg-blue-500' : 'bg-rose-500'].join(' ')} />
              {isWinner && <div className="text-xs font-bold text-yellow-400 mb-1">🏆 Winner</div>}
              <p className="text-xs text-muted-foreground font-medium">{inn.battingTeam.name}</p>
              <p className="text-xs text-muted-foreground">{inn.inningsNumber <= 2 ? `Innings ${inn.inningsNumber}` : 'Super Over'}</p>
              <p className="text-3xl font-black mt-1">{inn.totalRuns}<span className="text-xl text-muted-foreground">/{inn.totalWickets}</span></p>
              <p className="text-xs text-muted-foreground">({formatOvers(legalBallCount(inn.deliveries))} ov)</p>
            </div>
          );
        })}
      </div>

      {/* ── MOTM ── */}
      {match.status === 'COMPLETED' && (
        <div className="flex items-center gap-3">
          <Star className="h-4 w-4 text-amber-400 shrink-0" />
          <span className="text-sm font-medium text-muted-foreground">Player of the Match:</span>
          {match.userId === session.user.id ? (
            <MotmPicker matchId={match.id} players={allMatchPlayers} currentMotmId={(match as any).motmPlayer?.id ?? null} />
          ) : (match as any).motmPlayer ? (
            <span className="text-sm font-semibold text-amber-300">{(match as any).motmPlayer.name}</span>
          ) : (
            <span className="text-sm text-muted-foreground italic">Not announced</span>
          )}
        </div>
      )}

      {/* ── Tabs ── */}
      <Tabs defaultValue="scorecard">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scorecard">Scorecard</TabsTrigger>
          <TabsTrigger value="overs">Overs</TabsTrigger>
          <TabsTrigger value="commentary">Commentary</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
        </TabsList>

        {/* ── SCORECARD TAB ── */}
        <TabsContent value="scorecard" className="space-y-4 mt-4">
          {match.innings.map((inn) => {
            const isTeamA = inn.battingTeamId === match.teamAId;
            const accentText = isTeamA ? 'text-blue-400' : 'text-rose-400';
            const borderColor = isTeamA ? 'border-blue-500/30' : 'border-rose-500/30';
            const headerBg = isTeamA ? 'bg-blue-950/40' : 'bg-rose-950/40';
            const dividerColor = isTeamA ? 'border-blue-500/20' : 'border-rose-500/20';
            return (
              <div key={inn.id} className={`rounded-xl border ${borderColor} overflow-hidden`}>
                <div className={`px-4 py-3 ${headerBg} border-b ${borderColor}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`h-3 w-3 rounded-full ${isTeamA ? 'bg-blue-500' : 'bg-rose-500'}`} />
                      <span className="font-bold">{inn.battingTeam.name}</span>
                      <span className="text-xs text-muted-foreground">· {inn.inningsNumber <= 2 ? `Innings ${inn.inningsNumber}` : 'Super Over'}</span>
                    </div>
                    <span className="text-sm font-bold">{inn.totalRuns}/{inn.totalWickets} <span className="text-xs font-normal text-muted-foreground">({formatOvers(legalBallCount(inn.deliveries))} ov)</span></span>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  {/* Batting */}
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${accentText}`}>Batting</p>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-muted-foreground border-b border-border">
                          <th className="pb-1.5 pr-2">Batsman</th>
                          <th className="pb-1.5 text-xs text-muted-foreground text-left font-normal pr-2 max-w-[100px] hidden sm:table-cell">Dismissal</th>
                          <th className="pb-1.5 pr-2 text-right">R</th>
                          <th className="pb-1.5 pr-2 text-right">B</th>
                          <th className="pb-1.5 pr-2 text-right">4s</th>
                          <th className="pb-1.5 pr-2 text-right">6s</th>
                          <th className="pb-1.5 text-right">SR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inn.batterScores.map((bs) => (
                          <tr key={bs.id} className="border-b border-border/30">
                            <td className="py-2 pr-2">
                              <p className="font-medium">{bs.player.name}{!bs.isOut ? '*' : ''}</p>
                              <p className="text-xs text-muted-foreground sm:hidden">{bs.dismissalType ?? (bs.isOut ? 'out' : 'not out')}</p>
                            </td>
                            <td className="py-2 pr-2 text-xs text-muted-foreground hidden sm:table-cell">{bs.dismissalType ?? (bs.isOut ? 'out' : 'not out')}</td>
                            <td className="py-2 pr-2 text-right font-bold">{bs.runs}</td>
                            <td className="py-2 pr-2 text-right text-muted-foreground">{bs.balls}</td>
                            <td className="py-2 pr-2 text-right">{bs.fours}</td>
                            <td className="py-2 pr-2 text-right">{bs.sixes}</td>
                            <td className="py-2 text-right text-muted-foreground">{calcStrikeRate(bs.runs, bs.balls)}</td>
                          </tr>
                        ))}
                        <tr>
                          <td className="pt-2 pb-1 text-xs text-muted-foreground" colSpan={2}>
                            <span className="font-semibold">Extras</span>{' '}
                            <span className="text-[11px]">Wd {inn.wides} · Nb {inn.noBalls} · Lb {inn.legByes} · B {inn.byes} = {inn.extras}</span>
                          </td>
                          <td className="pt-2 pb-1 text-right font-bold" colSpan={5}>{inn.extras}</td>
                        </tr>
                        <tr className="border-t border-border">
                          <td className="pt-2 font-bold" colSpan={2}>Total</td>
                          <td className="pt-2 text-right font-black" colSpan={5}>{inn.totalRuns}/{inn.totalWickets} ({formatOvers(legalBallCount(inn.deliveries))} ov)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className={`border-t ${dividerColor}`} />

                  {/* Bowling */}
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${accentText}`}>Bowling</p>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-muted-foreground border-b border-border">
                          <th className="pb-1.5 pr-4">Bowler</th>
                          <th className="pb-1.5 pr-2 text-right">O</th>
                          <th className="pb-1.5 pr-2 text-right">M</th>
                          <th className="pb-1.5 pr-2 text-right">R</th>
                          <th className="pb-1.5 pr-2 text-right">W</th>
                          <th className="pb-1.5 text-right">Econ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inn.bowlerScores.map((bs) => (
                          <tr key={bs.id} className="border-b border-border/30">
                            <td className="py-2 pr-4 font-medium">{bs.player.name}</td>
                            <td className="py-2 pr-2 text-right text-muted-foreground">{formatOvers(legalBallCountForBowler(inn.deliveries, bs.player.id))}</td>
                            <td className="py-2 pr-2 text-right text-muted-foreground">{bs.maidens}</td>
                            <td className="py-2 pr-2 text-right">{bs.runs}</td>
                            <td className={`py-2 pr-2 text-right font-bold ${bs.wickets > 0 ? 'text-cricket-green' : 'text-muted-foreground'}`}>{bs.wickets}</td>
                            <td className="py-2 text-right text-muted-foreground">{calcBowlingEconomy(bs.runs, legalBallCountForBowler(inn.deliveries, bs.player.id))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Fall of Wickets */}
                  {(() => {
                    let cumRuns = 0, cumLegal = 0;
                    const fow: { wicketNum: number; runs: number; over: string; batsmanName: string }[] = [];
                    for (const d of inn.deliveries) {
                      const isLegal = !d.isWide && !d.isNoBall;
                      cumRuns += d.runs + (d.isWide || d.isNoBall ? 1 : 0);
                      if (isLegal) cumLegal++;
                      if (d.isWicket) {
                        fow.push({
                          wicketNum: fow.length + 1,
                          runs: cumRuns,
                          over: `${Math.floor(cumLegal / 6)}.${cumLegal % 6}`,
                          batsmanName: inn.batterScores.find((bs: any) => bs.playerId === d.batsmanId)?.player?.name ?? '?',
                        });
                      }
                    }
                    if (!fow.length) return null;
                    return (
                      <>
                        <div className={`border-t ${dividerColor}`} />
                        <div>
                          <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${accentText}`}>Fall of Wickets</p>
                          <div className="flex flex-wrap gap-1.5">
                            {fow.map((f) => (
                              <div key={f.wicketNum} className="flex items-center gap-1 rounded-lg border border-border/40 bg-muted/30 px-2 py-1">
                                <span className="text-[10px] font-black text-muted-foreground">{f.wicketNum}-</span>
                                <span className="text-xs font-bold">{f.runs}</span>
                                <span className="text-[10px] text-muted-foreground">({f.over})</span>
                                <span className="text-[10px] text-muted-foreground hidden sm:inline">· {f.batsmanName}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    );
                  })()}

                  {/* Partnerships */}
                  {(inn as any).partnerships?.length > 0 && (
                    <>
                      <div className={`border-t ${dividerColor}`} />
                      <div>
                        <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${accentText}`}>Partnerships</p>
                        <div className="space-y-1.5">
                          {(inn as any).partnerships.map((p: any, idx: number) => {
                            const b1 = inn.batterScores.find((bs: any) => bs.playerId === p.batsman1Id)?.player?.name ?? 'P1';
                            const b2 = inn.batterScores.find((bs: any) => bs.playerId === p.batsman2Id)?.player?.name ?? 'P2';
                            return (
                              <div key={p.id} className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">{idx + 1}. {b1 === b2 ? b1 : `${b1} & ${b2}`}</span>
                                <div className="flex items-center gap-3">
                                  <span className="font-bold">{p.runs} runs</span>
                                  <span className="text-muted-foreground">{p.balls} balls</span>
                                  <span className={p.isUnbroken ? 'text-cricket-green text-[10px]' : 'text-red-400 text-[10px]'}>{p.isUnbroken ? 'Active' : 'Broken'}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </TabsContent>

        {/* ── OVERS TAB ── */}
        <TabsContent value="overs" className="space-y-4 mt-4">
          {match.innings.map((inn) => {
            const isTeamA = inn.battingTeamId === match.teamAId;
            const accentText = isTeamA ? 'text-blue-400' : 'text-rose-400';
            const borderColor = isTeamA ? 'border-blue-500/30' : 'border-rose-500/30';
            const headerBg = isTeamA ? 'bg-blue-950/40' : 'bg-rose-950/40';

            // Build over-by-over data
            const overMap = new Map<number, { runs: number; wickets: number; extras: number; balls: string[] }>();
            let runningTotal = 0;
            for (const d of inn.deliveries) {
              const ov = d.overNumber;
              if (!overMap.has(ov)) overMap.set(ov, { runs: 0, wickets: 0, extras: 0, balls: [] });
              const row = overMap.get(ov)!;
              const r = d.runs + (d.isWide || d.isNoBall ? 1 : 0);
              row.runs += r;
              if (d.isWicket) row.wickets++;
              if (d.isWide || d.isNoBall) row.extras++;
              const ball = d.isWicket ? 'W' : d.isWide ? 'Wd' : d.isNoBall ? 'Nb' : String(d.runs);
              row.balls.push(ball);
            }
            const overs = Array.from(overMap.entries()).sort(([a], [b]) => a - b);

            return (
              <div key={inn.id} className={`rounded-xl border ${borderColor} overflow-hidden`}>
                <div className={`px-4 py-3 ${headerBg} border-b ${borderColor}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`h-3 w-3 rounded-full ${isTeamA ? 'bg-blue-500' : 'bg-rose-500'}`} />
                      <span className="font-bold">{inn.battingTeam.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{overs.length} overs · {inn.totalRuns} runs</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground border-b border-border">
                        <th className="px-4 py-2">Over</th>
                        <th className="px-2 py-2 text-right">Runs</th>
                        <th className="px-2 py-2 text-right">Wkts</th>
                        <th className="px-2 py-2 text-right">Extras</th>
                        <th className="px-4 py-2 text-right">Total</th>
                        <th className="px-4 py-2 text-left hidden sm:table-cell">Balls</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overs.map(([ovNum, row]) => {
                        runningTotal += row.runs;
                        return (
                          <tr key={ovNum} className="border-b border-border/30">
                            <td className="px-4 py-2 font-mono font-semibold">{ovNum + 1}</td>
                            <td className="px-2 py-2 text-right font-bold">{row.runs}</td>
                            <td className={`px-2 py-2 text-right font-bold ${row.wickets > 0 ? 'text-red-400' : 'text-muted-foreground'}`}>{row.wickets}</td>
                            <td className="px-2 py-2 text-right text-muted-foreground">{row.extras || '—'}</td>
                            <td className="px-4 py-2 text-right font-semibold text-muted-foreground">{runningTotal}</td>
                            <td className="px-4 py-2 hidden sm:table-cell">
                              <div className="flex gap-1">
                                {row.balls.map((b, i) => (
                                  <span key={i} className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-[10px] font-bold border ${
                                    b === 'W' ? 'bg-red-600/20 border-red-500/40 text-red-400' :
                                    b === 'Wd' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
                                    b === 'Nb' ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' :
                                    b === '6' ? 'bg-cricket-green/20 border-cricket-green/40 text-cricket-green' :
                                    b === '4' ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' :
                                    b === '0' ? 'bg-muted/50 border-border/40 text-muted-foreground' :
                                    'bg-muted/30 border-border/30 text-foreground'
                                  }`}>{b}</span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </TabsContent>

        {/* ── COMMENTARY TAB ── */}
        <TabsContent value="commentary" className="space-y-4 mt-4">
          {match.innings.map((inn) => {
            const isTeamA = inn.battingTeamId === match.teamAId;
            const borderColor = isTeamA ? 'border-blue-500/30' : 'border-rose-500/30';
            const headerBg = isTeamA ? 'bg-blue-950/40' : 'bg-rose-950/40';

            // Build commentary entries, latest first
            const entries = [...inn.deliveries].reverse().map((d) => {
              const batsman = allPlayerMap[d.batsmanId] ?? 'Batsman';
              const bowler = allPlayerMap[d.bowlerId] ?? 'Bowler';
              const fielder = d.fielderId ? (allPlayerMap[d.fielderId] ?? null) : null;

              let desc = '';
              let badge = '';
              let badgeColor = '';

              if (d.isWicket && !d.isWide && !d.isNoBall) {
                const wt = d.wicketType ?? 'Out';
                desc = fielder && wt === 'Caught' ? `OUT! Caught by ${fielder}` :
                       fielder && wt === 'RunOut' ? `OUT! Run out (${fielder})` :
                       fielder && wt === 'Stumped' ? `OUT! Stumped by ${fielder}` :
                       `OUT! ${wt}`;
                badge = 'W'; badgeColor = 'bg-red-600/20 border-red-500/40 text-red-400';
              } else if (d.isWide) {
                desc = d.runs > 0 ? `Wide, ${d.runs + 1} extras` : 'Wide';
                badge = 'Wd'; badgeColor = 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500';
              } else if (d.isNoBall) {
                desc = d.runs > 0 ? `No Ball + ${d.runs} run${d.runs > 1 ? 's' : ''}` : 'No Ball';
                badge = 'Nb'; badgeColor = 'bg-orange-500/10 border-orange-500/30 text-orange-400';
              } else if (d.runs === 6) {
                desc = 'SIX! Maximum!';
                badge = '6'; badgeColor = 'bg-cricket-green/20 border-cricket-green/40 text-cricket-green';
              } else if (d.runs === 4) {
                desc = 'FOUR! Boundary!';
                badge = '4'; badgeColor = 'bg-blue-500/20 border-blue-500/40 text-blue-400';
              } else if (d.isLegBye) {
                desc = `${d.runs} leg bye${d.runs > 1 ? 's' : ''}`;
                badge = String(d.runs); badgeColor = 'bg-muted/40 border-border/40 text-muted-foreground';
              } else if (d.isBye) {
                desc = `${d.runs} bye${d.runs > 1 ? 's' : ''}`;
                badge = String(d.runs); badgeColor = 'bg-muted/40 border-border/40 text-muted-foreground';
              } else if (d.runs === 0) {
                desc = 'Dot ball';
                badge = '·'; badgeColor = 'bg-muted/20 border-border/30 text-muted-foreground';
              } else {
                desc = `${d.runs} run${d.runs > 1 ? 's' : ''}`;
                badge = String(d.runs); badgeColor = 'bg-muted/30 border-border/40 text-foreground';
              }

              return { ovNum: d.overNumber, ballNum: d.ballNumber, batsman, bowler, desc, badge, badgeColor, isWicket: d.isWicket && !d.isWide && !d.isNoBall, isSix: d.runs === 6 && !d.isWide && !d.isNoBall, isFour: d.runs === 4 && !d.isWide && !d.isNoBall };
            });

            return (
              <div key={inn.id} className={`rounded-xl border ${borderColor} overflow-hidden`}>
                <div className={`px-4 py-3 ${headerBg} border-b ${borderColor}`}>
                  <div className="flex items-center gap-2">
                    <span className={`h-3 w-3 rounded-full ${isTeamA ? 'bg-blue-500' : 'bg-rose-500'}`} />
                    <span className="font-bold">{inn.battingTeam.name}</span>
                    <span className="text-xs text-muted-foreground">· {entries.length} balls</span>
                  </div>
                </div>
                {entries.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">No deliveries recorded yet.</p>
                ) : (
                  <div className="divide-y divide-border/30">
                    {entries.map((e, i) => (
                      <div key={i} className={`flex items-start gap-3 px-4 py-2.5 ${e.isWicket ? 'bg-red-500/5' : e.isSix ? 'bg-cricket-green/5' : e.isFour ? 'bg-blue-500/5' : ''}`}>
                        <span className={`mt-0.5 inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full border px-1 text-xs font-black ${e.badgeColor}`}>{e.badge}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">
                            <span className="font-mono">Ov {e.ovNum + 1}.{e.ballNum}</span>
                            {' · '}
                            <span className="font-semibold text-foreground/80">{e.bowler}</span>
                            {' to '}
                            <span className="font-semibold text-foreground/80">{e.batsman}</span>
                          </p>
                          <p className={`text-sm font-medium ${e.isWicket ? 'text-red-400' : e.isSix ? 'text-cricket-green' : e.isFour ? 'text-blue-400' : 'text-foreground'}`}>{e.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </TabsContent>

        {/* ── CHARTS TAB ── */}
        <TabsContent value="charts" className="mt-4">
          <MatchCharts
            innings={match.innings.map((inn) => ({
              inningsNumber: inn.inningsNumber,
              teamName: inn.battingTeam.name,
              totalRuns: inn.totalRuns,
              deliveries: inn.deliveries.map((d: any) => ({
                overNumber: d.overNumber,
                runs: d.runs,
                isWide: d.isWide,
                isNoBall: d.isNoBall,
              })),
            }))}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
