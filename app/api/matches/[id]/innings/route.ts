import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { pusherServer, matchChannel, PUSHER_EVENTS } from '@/lib/pusher-server';
import { sseHub } from '@/lib/sse';
import {
  getAuthSession,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
  badRequestResponse,
} from '@/lib/api-helpers';

const StartInningsSchema = z.object({
  battingTeamId: z.string(),
  inningsNumber: z.number().int().min(1).max(4),
  openingBatsmanIds: z.array(z.string()).length(2),
  openingBowlerId: z.string(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await getAuthSession();
  if (!userId) return unauthorizedResponse();

  try {
    const body = await req.json();
    const parsed = StartInningsSchema.safeParse(body);
    if (!parsed.success) return badRequestResponse(parsed.error.message);

    const match = await prisma.match.findFirst({ where: { id: params.id, userId } });
    if (!match) return notFoundResponse('Match');

    const { battingTeamId, inningsNumber, openingBatsmanIds, openingBowlerId } = parsed.data;

    // Complete current innings if it exists
    await prisma.innings.updateMany({
      where: { matchId: params.id, isCompleted: false },
      data: { isCompleted: true },
    });

    // Upsert innings to avoid unique constraint errors on retry
    const innings = await prisma.innings.upsert({
      where: { matchId_inningsNumber: { matchId: params.id, inningsNumber } },
      create: {
        matchId: params.id,
        battingTeamId,
        inningsNumber,
      },
      update: {
        isCompleted: false,
        battingTeamId,
      },
    });

    // Create batter scores for opening pair (skip if already exist)
    await prisma.batterScore.createMany({
      data: openingBatsmanIds.map((playerId, i) => ({
        inningsId: innings.id,
        playerId,
        battingOrder: i + 1,
      })),
      skipDuplicates: true,
    });

    // Create bowler score for opening bowler (skip if already exists)
    await prisma.bowlerScore.createMany({
      data: [{ inningsId: innings.id, playerId: openingBowlerId }],
      skipDuplicates: true,
    });

    sseHub.emit(params.id, 'update');

    try {
      await pusherServer.trigger(matchChannel(params.id), PUSHER_EVENTS.INNINGS_CHANGED, { innings });
    } catch (_pusherErr) {
      // Pusher not configured or unavailable
    }

    return NextResponse.json(innings, { status: 201 });
  } catch (error) {
    return serverErrorResponse(error);
  }
}

// Mark the current active innings as complete (end of innings 1 before starting innings 2)
export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await getAuthSession();
  if (!userId) return unauthorizedResponse();

  try {
    const match = await prisma.match.findFirst({ where: { id: params.id, userId } });
    if (!match) return notFoundResponse('Match');

    await prisma.innings.updateMany({
      where: { matchId: params.id, isCompleted: false },
      data: { isCompleted: true },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
