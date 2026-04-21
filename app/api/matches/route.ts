import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import {
  getAuthSession,
  unauthorizedResponse,
  serverErrorResponse,
  badRequestResponse,
  matchMemberFilter,
} from '@/lib/api-helpers';

const CreateMatchSchema = z.object({
  teamAId: z.string(),
  teamBId: z.string(),
  overs: z.number().int().min(1).max(50).default(20),
  venue: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  tossWinner: z.string().optional(),
  tossDecision: z.enum(['bat', 'field']).optional(),
  tournamentId: z.string().optional(),
  matchType: z.string().default('Friendly'),
  playingXI_A: z.array(z.string()).min(2).max(11).optional(),
  playingXI_B: z.array(z.string()).min(2).max(11).optional(),
});

export async function GET(req: NextRequest) {
  const { userId } = await getAuthSession();
  if (!userId) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(req.url);
    const tournamentId = searchParams.get('tournamentId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const skip = (page - 1) * limit;

    const where = {
      ...matchMemberFilter(userId),
      ...(tournamentId && { tournamentId }),
      ...(status && { status: status as any }),
    };

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        include: {
          teamA: true,
          teamB: true,
          tournament: { select: { name: true } },
          innings: { select: { totalRuns: true, totalWickets: true, totalOvers: true, inningsNumber: true, battingTeamId: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.match.count({ where }),
    ]);

    return NextResponse.json({ matches, total, page, limit });
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await getAuthSession();
  if (!userId) return unauthorizedResponse();

  try {
    const body = await req.json();
    const parsed = CreateMatchSchema.safeParse(body);
    if (!parsed.success) return badRequestResponse(parsed.error.message);

    if (parsed.data.teamAId === parsed.data.teamBId) {
      return badRequestResponse('Team A and Team B must be different');
    }

    const { playingXI_A: _a, playingXI_B: _b, ...matchData } = parsed.data;

    const match = await prisma.match.create({
      data: { ...matchData, userId },
      include: { teamA: true, teamB: true },
    });

    return NextResponse.json(match, { status: 201 });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
