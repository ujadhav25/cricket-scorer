import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import {
  getAuthSession,
  unauthorizedResponse,
  serverErrorResponse,
  badRequestResponse,
  tournamentMemberFilter,
} from '@/lib/api-helpers';

const CreateTournamentSchema = z.object({
  name: z.string().min(1).max(100),
  format: z.enum(['LEAGUE', 'KNOCKOUT', 'GROUP_KNOCKOUT', 'BILATERAL']).default('LEAGUE'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  description: z.string().optional(),
  bannerUrl: z.string().url().optional(),
  defaultOvers: z.number().int().min(1).max(50).default(20),
  totalMatches: z.number().int().min(1).max(9).default(3),
  teamIds: z.array(z.string()).min(2).optional(),
});

export async function GET(req: NextRequest) {
  const { userId } = await getAuthSession();
  if (!userId) return unauthorizedResponse();

  try {
    const tournaments = await prisma.tournament.findMany({
      where: tournamentMemberFilter(userId),
      include: {
        teams: { include: { team: true } },
        _count: { select: { matches: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(tournaments);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await getAuthSession();
  if (!userId) return unauthorizedResponse();

  try {
    const body = await req.json();
    const parsed = CreateTournamentSchema.safeParse(body);
    if (!parsed.success) return badRequestResponse(parsed.error.message);

    const { teamIds, ...tournamentData } = parsed.data;

    const tournament = await prisma.tournament.create({
      data: {
        ...tournamentData,
        userId,
        ...(teamIds && {
          teams: {
            create: teamIds.map((teamId) => ({ teamId })),
          },
        }),
      },
      include: { teams: { include: { team: true } } },
    });

    return NextResponse.json(tournament, { status: 201 });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
