import { adminAuth } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate, calcStrikeRate, calcBowlingEconomy, formatOvers, legalBallCount } from '@/lib/utils';
import { ArrowLeft, Star, Trophy } from 'lucide-react';

const statusColor: Record<string, string> = {
  LIVE: 'bg-red-500 text-white',
  COMPLETED: 'bg-green-700 text-white',
  UPCOMING: 'bg-muted text-muted-foreground',
};

export default async function AdminMatchDetailPage({ params }: { params: { id: string } }) {
  const session = await adminAuth();
  if (!(session as any)?.admin) redirect('/admin/login');

  const match = await prisma.match.findUnique({
    where: { id: params.id },
    include: {
      teamA: true,
      teamB: true,
      user: { select: { name: true, email: true } },
      tournament: { select: { name: true, id: true } },
      motmPlayer: { select: { id: true, name: true } },
      innings: {
        include: {
          batterScores: { include: { player: true }, orderBy: { battingOrder: 'asc' } },
          bowlerScores: { include: { player: true } },
          battingTeam: true,
          deliveries: {
            select: { overNumber: true, ballNumber: true, isWide: true, isNoBall: true, isLegBye: true, isBye: true, bowlerId: true, isWicket: true, batsmanId: true, runs: true, wicketType: true },
            orderBy: [{ overNumber: 'asc' }, { ballNumber: 'asc' }],
          },
        },
        orderBy: { inningsNumber: 'asc' },
      },
    },
  });

  if (!match) notFound();

  // Determine winner
  let winnerName: string | undefined;
  let decisiveInningsNumber: number | null = null;
  if (match.status === 'COMPLETED' && match.innings.length >= 2) {
    const inn1 = match.innings.find((i) => i.inningsNumber === 1);
    const inn2 = match.innings.find((i) => i.inningsNumber === 2);
    const inn3 = match.innings.find((i) => i.inningsNumber === 3);
    const inn4 = match.innings.find((i) => i.inningsNumber === 4);
    const teamName = (id: string) => id === match.teamAId ? match.teamA.name : match.teamB.name;
    if (inn3 && inn4) {
      if (inn4.totalRuns > inn3.totalRuns) { winnerName = teamName(inn4.battingTeamId); decisiveInningsNumber = 4; }
      else if (inn3.totalRuns > inn4.totalRuns) { winnerName = teamName(inn3.battingTeamId); decisiveInningsNumber = 3; }
    } else if (inn1 && inn2) {
      if (inn2.totalRuns > inn1.totalRuns) { winnerName = teamName(inn2.battingTeamId); decisiveInningsNumber = 2; }
      else if (inn1.totalRuns > inn2.totalRuns) { winnerName = teamName(inn1.battingTeamId); decisiveInningsNumber = 1; }
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Back */}
      <Link href="/admin/matches" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Matches
      </Link>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {match.tournament && <span className="text-amber-400 font-medium">{match.tournament.name}</span>}
          <span>{formatDate(match.createdAt.toISOString())}</span>
          {match.venue && <span>· {match.venue}</span>}
          <span>· {match.overs} ov</span>
          <span>· by {match.user.name ?? match.user.email}</span>
        </div>
        <h1 className="text-2xl font-bold">
          <span style={{ color: match.teamA.color }}>{match.teamA.name}</span>
          <span className="text-muted-foreground mx-2">vs</span>
          <span style={{ color: match.teamB.color }}>{match.teamB.name}</span>
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor[match.status] ?? ''}`}>
            {match.status}
          </span>
          {winnerName && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-400">
              <Trophy className="h-3.5 w-3.5" /> {winnerName} won
            </span>
          )}
        </div>
        {match.tossWinner && (
          <p className="text-xs text-muted-foreground">
            🪙 {match.tossWinner === match.teamAId ? match.teamA.name : match.teamB.name} won toss · elected to {match.tossDecision}
          </p>
        )}
        {match.motmPlayer && (
          <p className="text-xs text-amber-400 inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5" /> MoTM: {match.motmPlayer.name}
          </p>
        )}
      </div>

      {/* Score Cards */}
      {match.innings.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {match.innings.map((inn) => {
            const isTeamA = inn.battingTeamId === match.teamAId;
            const isWinner = winnerName && inn.inningsNumber === decisiveInningsNumber;
            return (
              <div key={inn.id} className={[
                'rounded-xl border p-4',
                isTeamA ? 'border-blue-500/40 bg-blue-950/20' : 'border-rose-500/40 bg-rose-950/20',
                isWinner ? 'ring-2 ring-yellow-400' : '',
              ].join(' ')}>
                {isWinner && <div className="text-xs font-bold text-yellow-400 mb-1">🏆 Winner</div>}
                <p className="text-xs text-muted-foreground font-medium">{inn.battingTeam.name}</p>
                <p className="text-xs text-muted-foreground mb-1">Innings {inn.inningsNumber <= 2 ? inn.inningsNumber : 'Super Over'}</p>
                <p className="text-3xl font-black">{inn.totalRuns}<span className="text-xl text-muted-foreground">/{inn.totalWickets}</span></p>
                <p className="text-xs text-muted-foreground">({formatOvers(legalBallCount(inn.deliveries))} ov)</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Scorecard per innings */}
      {match.innings.map((inn) => {
        const isTeamA = inn.battingTeamId === match.teamAId;
        const accentText = isTeamA ? 'text-blue-400' : 'text-rose-400';
        const borderColor = isTeamA ? 'border-blue-500/30' : 'border-rose-500/30';
        const headerBg = isTeamA ? 'bg-blue-950/40' : 'bg-rose-950/40';

        return (
          <div key={inn.id} className={`rounded-xl border ${borderColor} overflow-hidden`}>
            <div className={`px-4 py-3 ${headerBg} border-b ${borderColor}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-3 w-3 rounded-full ${isTeamA ? 'bg-blue-500' : 'bg-rose-500'}`} />
                  <span className="font-bold">{inn.battingTeam.name}</span>
                  <span className="text-xs text-muted-foreground">· Innings {inn.inningsNumber <= 2 ? inn.inningsNumber : 'Super Over'}</span>
                </div>
                <span className="font-black text-lg">{inn.totalRuns}/{inn.totalWickets} <span className="text-xs font-normal text-muted-foreground">({formatOvers(legalBallCount(inn.deliveries))} ov)</span></span>
              </div>
            </div>

            {/* Batting */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className={`border-b ${borderColor} text-muted-foreground`}>
                    <th className="text-left px-4 py-2">Batter</th>
                    <th className="text-right px-2 py-2">R</th>
                    <th className="text-right px-2 py-2">B</th>
                    <th className="text-right px-2 py-2">4s</th>
                    <th className="text-right px-2 py-2">6s</th>
                    <th className="text-right px-4 py-2">SR</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${borderColor}`}>
                  {inn.batterScores.map((bs) => (
                    <tr key={bs.id}>
                      <td className="px-4 py-2">
                        <span className={`font-medium ${accentText}`}>{bs.player.name}</span>
                        {bs.isOut && bs.dismissalType && (
                          <p className="text-[10px] text-muted-foreground">{bs.dismissalType}</p>
                        )}
                        {!bs.isOut && <p className="text-[10px] text-muted-foreground">not out</p>}
                      </td>
                      <td className="text-right px-2 py-2 font-bold">{bs.runs}{!bs.isOut ? '*' : ''}</td>
                      <td className="text-right px-2 py-2 text-muted-foreground">{bs.balls}</td>
                      <td className="text-right px-2 py-2 text-muted-foreground">{bs.fours}</td>
                      <td className="text-right px-2 py-2 text-muted-foreground">{bs.sixes}</td>
                      <td className="text-right px-4 py-2 text-muted-foreground">{calcStrikeRate(bs.runs, bs.balls)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bowling */}
            {inn.bowlerScores.length > 0 && (
              <div className={`border-t ${borderColor} overflow-x-auto`}>
                <table className="w-full text-xs">
                  <thead>
                    <tr className={`border-b ${borderColor} text-muted-foreground`}>
                      <th className="text-left px-4 py-2">Bowler</th>
                      <th className="text-right px-2 py-2">O</th>
                      <th className="text-right px-2 py-2">M</th>
                      <th className="text-right px-2 py-2">R</th>
                      <th className="text-right px-2 py-2">W</th>
                      <th className="text-right px-4 py-2">Econ</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${borderColor}`}>
                    {inn.bowlerScores.map((bs) => (
                      <tr key={bs.id}>
                        <td className="px-4 py-2 font-medium">{bs.player.name}</td>
                        <td className="text-right px-2 py-2 text-muted-foreground">{bs.overs}</td>
                        <td className="text-right px-2 py-2 text-muted-foreground">{bs.maidens}</td>
                        <td className="text-right px-2 py-2 text-muted-foreground">{bs.runs}</td>
                        <td className="text-right px-2 py-2 font-bold text-cricket-green">{bs.wickets}</td>
                        <td className="text-right px-4 py-2 text-muted-foreground">{calcBowlingEconomy(bs.runs, bs.balls)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
