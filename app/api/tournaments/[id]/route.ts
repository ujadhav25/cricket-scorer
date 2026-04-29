import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import {
  getAuthSession,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
  badRequestResponse,
  tournamentMemberFilter,
} from '@/lib/api-helpers';

const UpdateTournamentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  format: z.enum(['LEAGUE', 'KNOCKOUT', 'GROUP_KNOCKOUT', 'BILATERAL']).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  bannerUrl: z.string().url().optional().nullable(),
  defaultOvers: z.number().int().min(1).max(50).optional(),
  totalMatches: z.number().int().min(1).max(9).optional(),
  status: z.enum(['UPCOMING', 'LIVE', 'COMPLETED']).optional(),
  teamIds: z.array(z.string()).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await getAuthSession();
  if (!userId) return unauthorizedResponse();

  try {
    const tournament = await prisma.tournament.findFirst({
      where: { id: params.id, ...tournamentMemberFilter(userId) },
      include: {
        teams: { include: { team: { include: { players: { include: { player: true } } } } } },
        matches: {
          include: { teamA: true, teamB: true, innings: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!tournament) return notFoundResponse('Tournament');
    return NextResponse.json(tournament);
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
    const body = await req.json();
    const parsed = UpdateTournamentSchema.safeParse(body);
    if (!parsed.success) {
      logger.warn('Tournament update validation error', { issues: parsed.error.issues });
      return badRequestResponse(parsed.error.message);
    }

    const tournament = await prisma.tournament.findFirst({ where: { id: params.id, userId } });
    if (!tournament) return notFoundResponse('Tournament');

    const { teamIds, startDate, endDate, ...rest } = parsed.data;

    const updated = await prisma.tournament.update({
      where: { id: params.id },
      data: {
        ...rest,
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(teamIds && {
          teams: {
            deleteMany: {},
            create: teamIds.map((teamId) => ({ teamId })),
          },
        }),
      },
      include: { teams: { include: { team: true } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await getAuthSession();
  if (!userId) return unauthorizedResponse();

  try {
    const tournament = await prisma.tournament.findFirst({ where: { id: params.id, userId } });
    if (!tournament) return notFoundResponse('Tournament');

    await prisma.tournament.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
