import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string; opponentId: string } }
) {
  const { id: teamAId, opponentId: teamBId } = params;

  const [teamA, teamB, matches] = await Promise.all([
    prisma.team.findUnique({ where: { id: teamAId }, select: { name: true, color: true } }),
    prisma.team.findUnique({ where: { id: teamBId }, select: { name: true, color: true } }),
    prisma.match.findMany({
      where: {
        status: 'COMPLETED',
        OR: [
          { teamAId, teamBId },
          { teamAId: teamBId, teamBId: teamAId },
        ],
      },
      include: {
        teamA: { select: { name: true } },
        teamB: { select: { name: true } },
        tournament: { select: { name: true } },
        innings: { orderBy: { inningsNumber: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  if (!teamA || !teamB) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  }

  let aWins = 0, bWins = 0, ties = 0;
  let aRunsTotal = 0, bRunsTotal = 0;
  let aHighScore = 0, bHighScore = 0;

  const results = matches.map((m) => {
    const aInn = m.innings.find((i) => i.battingTeamId === teamAId);
    const bInn = m.innings.find((i) => i.battingTeamId === teamBId);

    const aRuns = aInn?.totalRuns ?? 0;
    const bRuns = bInn?.totalRuns ?? 0;
    const aWickets = aInn?.totalWickets ?? 0;
    const bWickets = bInn?.totalWickets ?? 0;

    if (aRuns > aHighScore) aHighScore = aRuns;
    if (bRuns > bHighScore) bHighScore = bRuns;
    aRunsTotal += aRuns;
    bRunsTotal += bRuns;

    let winner: 'a' | 'b' | 'tie';
    let resultLine: string;
    if (aRuns > bRuns) {
      winner = 'a';
      aWins++;
      const margin = aRuns - bRuns;
      resultLine = `${teamA.name} won by ${margin} run${margin !== 1 ? 's' : ''}`;
    } else if (bRuns > aRuns) {
      winner = 'b';
      bWins++;
      const wicketsLeft = 10 - bWickets;
      resultLine = `${teamB.name} won by ${wicketsLeft} wicket${wicketsLeft !== 1 ? 's' : ''}`;
    } else {
      winner = 'tie';
      ties++;
      resultLine = 'Match tied';
    }

    return {
      matchId: m.id,
      date: m.createdAt,
      tournament: m.tournament?.name ?? null,
      aScore: `${aRuns}/${aWickets}`,
      bScore: `${bRuns}/${bWickets}`,
      winner,
      resultLine,
    };
  });

  const totalMatches = aWins + bWins + ties;

  return NextResponse.json({
    teamA: { id: teamAId, name: teamA.name, color: teamA.color },
    teamB: { id: teamBId, name: teamB.name, color: teamB.color },
    stats: {
      totalMatches,
      aWins,
      bWins,
      ties,
      aAvgScore: totalMatches > 0 ? Math.round(aRunsTotal / totalMatches) : 0,
      bAvgScore: totalMatches > 0 ? Math.round(bRunsTotal / totalMatches) : 0,
      aHighScore,
      bHighScore,
    },
    results,
  });
}
