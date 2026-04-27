import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import {
  getAuthSession,
  unauthorizedResponse,
  serverErrorResponse,
  badRequestResponse,
  teamMemberFilter,
} from '@/lib/api-helpers';

const CreateTeamSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#16a34a'),
  homeGround: z.string().optional(),
  playerIds: z.array(z.string()).max(15).optional().default([]),
  captainPlayerId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { userId } = await getAuthSession();
  if (!userId) return unauthorizedResponse();

  try {
    const teams = await prisma.team.findMany({
      where: teamMemberFilter(userId),
      include: {
        players: { include: { player: true } },
        _count: { select: { players: true } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(teams);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await getAuthSession();
  if (!userId) return unauthorizedResponse();

  try {
    const body = await req.json();
    const parsed = CreateTeamSchema.safeParse(body);
    if (!parsed.success) return badRequestResponse(parsed.error.message);

    const { playerIds, captainPlayerId, ...teamData } = parsed.data;

    // Resolve captainPlayerId → captainUserId
    let captainUserId: string | null = null;
    if (captainPlayerId) {
      const player = await prisma.player.findUnique({ where: { id: captainPlayerId }, select: { userId: true } });
      captainUserId = player?.userId ?? null;
    }

    const team = await prisma.team.create({
      data: {
        ...teamData,
        userId,
        ...(captainUserId ? { captainUserId } : {}),
        players: {
          create: playerIds.map((playerId) => ({ playerId })),
        },
      },
      include: {
        players: { include: { player: true } },
      },
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
