import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import {
  getAuthSession,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
  badRequestResponse,
  matchMemberFilter,
} from '@/lib/api-helpers';

const UpdateMatchSchema = z.object({
  overs: z.number().int().min(1).max(50).optional(),
  venue: z.string().optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
  tossWinner: z.string().optional(),
  tossDecision: z.enum(['bat', 'field']).optional(),
  matchType: z.string().optional(),
  tournamentId: z.string().optional().nullable(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await getAuthSession();
  if (!userId) return unauthorizedResponse();

  try {
    const match = await prisma.match.findFirst({
      where: { id: params.id, ...matchMemberFilter(userId) },
      include: {
        teamA: { include: { players: { include: { player: true } } } },
        teamB: { include: { players: { include: { player: true } } } },
        tournament: { select: { name: true, id: true } },
        innings: {
          include: {
            deliveries: {
              orderBy: [{ overNumber: 'asc' }, { ballNumber: 'asc' }],
            },
            batterScores: { include: { player: true } },
            bowlerScores: { include: { player: true } },
            battingTeam: true,
          },
          orderBy: { inningsNumber: 'asc' },
        },
      },
    });

    if (!match) return notFoundResponse('Match');
    return NextResponse.json(match);
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
    // Debug: log userId vs match userId
    const matchRaw = await prisma.match.findUnique({ where: { id: params.id }, select: { userId: true } });
    console.log('[DELETE match] session userId:', userId, '| match userId:', matchRaw?.userId);

    const match = await prisma.match.findFirst({ where: { id: params.id, userId } });
    if (!match) return notFoundResponse('Match');

    await prisma.match.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await getAuthSession();
  if (!userId) return unauthorizedResponse();

  try {
    const match = await prisma.match.findFirst({ where: { id: params.id, userId } });
    if (!match) return notFoundResponse('Match');

    const body = await req.json();
    const parsed = UpdateMatchSchema.safeParse(body);
    if (!parsed.success) return badRequestResponse(parsed.error.message);

    const updated = await prisma.match.update({
      where: { id: params.id },
      data: {
        ...(parsed.data.overs !== undefined && { overs: parsed.data.overs }),
        ...(parsed.data.venue !== undefined && { venue: parsed.data.venue }),
        ...(parsed.data.tossWinner !== undefined && { tossWinner: parsed.data.tossWinner }),
        ...(parsed.data.tossDecision !== undefined && { tossDecision: parsed.data.tossDecision }),
        ...(parsed.data.matchType !== undefined && { matchType: parsed.data.matchType }),
        ...(parsed.data.tournamentId !== undefined && { tournamentId: parsed.data.tournamentId || null }),
        ...(parsed.data.scheduledAt !== undefined && { scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null }),
      },
      include: { teamA: true, teamB: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
