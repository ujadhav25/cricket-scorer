import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession, unauthorizedResponse, notFoundResponse, serverErrorResponse, badRequestResponse } from '@/lib/api-helpers';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await getAuthSession();
    if (!userId) return unauthorizedResponse();

    const match = await prisma.match.findFirst({
      where: { id: params.id, userId },
      select: { id: true, playingXI_A: true, playingXI_B: true, teamA: { select: { players: { select: { playerId: true } } } }, teamB: { select: { players: { select: { playerId: true } } } } },
    });
    if (!match) return notFoundResponse('Match');

    const { playerId } = await req.json();

    // Validate playerId belongs to one of the match teams
    if (playerId !== null && playerId !== undefined) {
      const teamPlayerIds = [
        ...match.teamA.players.map((p) => p.playerId),
        ...match.teamB.players.map((p) => p.playerId),
      ];
      if (!teamPlayerIds.includes(playerId)) {
        return badRequestResponse('Player does not belong to this match');
      }
    }

    const updated = await prisma.match.update({
      where: { id: params.id },
      data: { motmPlayerId: playerId ?? null },
      select: { motmPlayerId: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
