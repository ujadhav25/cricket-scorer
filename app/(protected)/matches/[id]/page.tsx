import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatDate, calcStrikeRate, calcBowlingEconomy, formatOvers, legalBallCount, legalBallCountForBowler } from '@/lib/utils';
import { Activity } from 'lucide-react';
import DeleteMatchButton from './DeleteMatchButton';
import { FireworksAnim } from '@/components/animations/FireworksAnim';
import { ShareMatchButton } from '@/components/ShareMatchButton';

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
      innings: {
        include: {
          batterScores: { include: { player: true }, orderBy: { battingOrder: 'asc' } },
          bowlerScores: { include: { player: true } },
          battingTeam: true,
          deliveries: { select: { overNumber: true, isWide: true, isNoBall: true, bowlerId: true } },
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

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto">
      {match.status === 'COMPLETED' && <FireworksAnim winnerName={winnerName} matchId={match.id} />}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs mb-1">
            {match.tournament && <span className="text-amber-400 font-medium">{match.tournament.name}</span>}
            <span>{formatDate(match.createdAt)}</span>
            {match.venue && <span>· {match.venue}</span>}
          </div>
          <h1 className="text-xl font-bold leading-tight">{match.teamA.name} vs {match.teamB.name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              match.status === 'LIVE' ? 'bg-red-500 text-white animate-pulse' :
              match.status === 'COMPLETED' ? 'bg-green-700 text-white' : 'bg-muted text-muted-foreground'}`}>
              {match.status}
            </span>
            {winnerName && (
              <span className="text-xs font-semibold text-yellow-400">🏆 {winnerName} won</span>
            )}
          </div>
          {match.tossWinner && (
            <p className="text-xs text-muted-foreground mt-1">
              Toss: {match.tossWinner === match.teamAId ? match.teamA.name : match.teamB.name} won · chose to {match.tossDecision}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {match.status !== 'COMPLETED' && match.userId === session.user.id && (
            <Button asChild size="sm" className="bg-cricket-green hover:bg-cricket-green/90">
              <Link href={`/matches/${match.id}/score`}><Activity className="mr-1.5 h-4 w-4" />Score</Link>
            </Button>
          )}
          <ShareMatchButton shareToken={match.shareToken} matchTitle={`${match.teamA.name} vs ${match.teamB.name}`} />
          {match.userId === session.user.id && <DeleteMatchButton matchId={match.id} />}
        </div>
      </div>

      {/* Score Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        {match.innings.map((inn) => {
          // Only one innings is decisive — the one that determined the result.
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
              <p className="text-xs text-muted-foreground">Innings {inn.inningsNumber <= 2 ? inn.inningsNumber : `Super Over`}</p>
              <p className="text-3xl font-black mt-1">{inn.totalRuns}<span className="text-xl text-muted-foreground">/{inn.totalWickets}</span></p>
              <p className="text-xs text-muted-foreground">({formatOvers(legalBallCount(inn.deliveries))} ov)</p>
            </div>
          );
        })}
      </div>

      {/* Scorecards — one per innings with clear team header */}
      {match.innings.map((inn) => {
        const isTeamA = inn.battingTeamId === match.teamAId;
        const accent = isTeamA ? 'text-blue-400 border-blue-500/40 bg-blue-950/20' : 'text-rose-400 border-rose-500/40 bg-rose-950/20';
        const accentBorder = isTeamA ? 'border-l-blue-500' : 'border-l-rose-500';
        return (
          <div key={inn.id} className={`rounded-xl border ${isTeamA ? 'border-blue-500/30' : 'border-rose-500/30'} overflow-hidden`}>
            {/* Team header */}
            <div className={`px-4 py-3 ${isTeamA ? 'bg-blue-950/40' : 'bg-rose-950/40'} border-b ${isTeamA ? 'border-blue-500/30' : 'border-rose-500/30'}`}>
              <div className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${isTeamA ? 'bg-blue-500' : 'bg-rose-500'}`} />
                <span className="font-bold">{inn.battingTeam.name}</span>
                <span className="text-xs text-muted-foreground">· {inn.inningsNumber <= 2 ? `Innings ${inn.inningsNumber}` : 'Super Over'}</span>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Batting */}
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isTeamA ? 'text-blue-400' : 'text-rose-400'}`}>Batting</p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b border-border">
                      <th className="pb-1.5 pr-4">Batsman</th>
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
                        <td className="py-2 pr-4">
                          <p className="font-medium">{bs.player.name}{!bs.isOut ? '*' : ''}</p>
                          {bs.dismissalType && <p className="text-xs text-muted-foreground">{bs.dismissalType}</p>}
                        </td>
                        <td className="py-2 pr-2 text-right font-bold">{bs.runs}</td>
                        <td className="py-2 pr-2 text-right text-muted-foreground">{bs.balls}</td>
                        <td className="py-2 pr-2 text-right">{bs.fours}</td>
                        <td className="py-2 pr-2 text-right">{bs.sixes}</td>
                        <td className="py-2 text-right text-muted-foreground">{calcStrikeRate(bs.runs, bs.balls)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td className="pt-2 text-xs text-muted-foreground font-semibold" colSpan={2}>Extras</td>
                      <td className="pt-2 text-right text-xs text-muted-foreground" colSpan={4}>
                        Wd {inn.wides} · Nb {inn.noBalls} · Lb {inn.legByes} · B {inn.byes}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Divider */}
              <div className={`border-t ${isTeamA ? 'border-blue-500/20' : 'border-rose-500/20'}`} />

              {/* Bowling — by the opposing team */}
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isTeamA ? 'text-blue-400' : 'text-rose-400'}`}>Bowling</p>
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
            </div>
          </div>
        );
      })}
    </div>
  );
}
