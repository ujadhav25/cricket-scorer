import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { pusherServer, matchChannel, PUSHER_EVENTS } from '@/lib/pusher-server';
import { sseHub } from '@/lib/sse';
import {
  getAuthSession,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api-helpers';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await getAuthSession();
  if (!userId) return unauthorizedResponse();

  try {
    const match = await prisma.match.findFirst({ where: { id: params.id, userId } });
    if (!match) return notFoundResponse('Match');

    const completed = await prisma.match.update({
      where: { id: params.id },
      data: {
        status: 'COMPLETED',
        innings: {
          updateMany: {
            where: { matchId: params.id },
            data: { isCompleted: true },
          },
        },
      },
      include: {
        teamA: true,
        teamB: true,
        innings: true,
      },
    });

    sseHub.emit(params.id, 'completed');

    try {
      await pusherServer.trigger(matchChannel(params.id), PUSHER_EVENTS.MATCH_COMPLETED, { match: completed });
    } catch (_pusherErr) {
      // Pusher not configured — SSE handles it
    }

    return NextResponse.json(completed);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
