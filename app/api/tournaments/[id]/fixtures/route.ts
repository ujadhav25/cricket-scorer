import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getAuthSession,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
  badRequestResponse,
} from '@/lib/api-helpers';

type TeamEntry = { teamId: string };

function generateLeagueFixtures(teams: TeamEntry[], tournamentId: string, userId: string, overs: number) {
  const fixtures: Array<{
    tournamentId: string;
    userId: string;
    teamAId: string;
    teamBId: string;
    overs: number;
    matchType: string;
    status: string;
  }> = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      fixtures.push({
        tournamentId,
        userId,
        teamAId: teams[i].teamId,
        teamBId: teams[j].teamId,
        overs,
        matchType: 'Tournament',
        status: 'UPCOMING',
      });
    }
  }
  return fixtures;
}

function generateKnockoutFixtures(teams: TeamEntry[], tournamentId: string, userId: string, overs: number) {
  // Seed positions 1 vs last, 2 vs second-last, etc.
  const fixtures: Array<{
    tournamentId: string;
    userId: string;
    teamAId: string;
    teamBId: string;
    overs: number;
    matchType: string;
    status: string;
  }> = [];
  const n = Math.pow(2, Math.ceil(Math.log2(teams.length)));
  const seeded = [...teams];
  while (seeded.length < n) seeded.push(null as any); // byes
  for (let i = 0; i < n / 2; i++) {
    const t1 = seeded[i];
    const t2 = seeded[n - 1 - i];
    if (t1 && t2) {
      fixtures.push({
        tournamentId,
        userId,
        teamAId: t1.teamId,
        teamBId: t2.teamId,
        overs,
        matchType: 'Tournament',
        status: 'UPCOMING',
      });
    }
  }
  return fixtures;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await getAuthSession();
  if (!userId) return unauthorizedResponse();

  try {
    const tournament = await prisma.tournament.findFirst({
      where: { id: params.id, userId },
    });
    if (!tournament) return notFoundResponse('Tournament');

    const matches = await prisma.match.findMany({
      where: { tournamentId: params.id },
      include: {
        teamA: true,
        teamB: true,
        innings: { select: { totalRuns: true, totalWickets: true, battingTeamId: true, inningsNumber: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(matches);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await getAuthSession();
  if (!userId) return unauthorizedResponse();

  try {
    const tournament = await prisma.tournament.findFirst({
      where: { id: params.id, userId },
      include: { teams: true },
    });
    if (!tournament) return notFoundResponse('Tournament');
    if (tournament.teams.length < 2) {
      return badRequestResponse('Tournament needs at least 2 teams to generate fixtures');
    }

    // Delete existing upcoming fixtures
    await prisma.match.deleteMany({
      where: { tournamentId: params.id, status: 'UPCOMING' },
    });

    const teams = tournament.teams;
    let fixtures: any[] = [];

    if (tournament.format === 'LEAGUE') {
      fixtures = generateLeagueFixtures(teams, params.id, userId, tournament.defaultOvers);
    } else if (tournament.format === 'KNOCKOUT') {
      fixtures = generateKnockoutFixtures(teams, params.id, userId, tournament.defaultOvers);
    } else if (tournament.format === 'BILATERAL') {
      // Bilateral: exactly 2 teams, generate totalMatches matches between them
      const [t1, t2] = teams;
      const count = (tournament as any).totalMatches ?? 3;
      for (let i = 0; i < count; i++) {
        fixtures.push({
          tournamentId: params.id,
          userId,
          teamAId: t1.teamId,
          teamBId: t2.teamId,
          overs: tournament.defaultOvers,
          matchType: 'Tournament',
          status: 'UPCOMING',
        });
      }
    } else {
      // GROUP_KNOCKOUT: split into 2 groups, league within groups
      const half = Math.floor(teams.length / 2);
      fixtures = [
        ...generateLeagueFixtures(teams.slice(0, half), params.id, userId, tournament.defaultOvers),
        ...generateLeagueFixtures(teams.slice(half), params.id, userId, tournament.defaultOvers),
      ];
    }

    const created = await prisma.match.createMany({ data: fixtures });
    return NextResponse.json({ created: created.count });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
