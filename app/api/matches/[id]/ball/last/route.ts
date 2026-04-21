import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { pusherServer, matchChannel, PUSHER_EVENTS } from '@/lib/pusher-server';
import {
  getAuthSession,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
  badRequestResponse,
} from '@/lib/api-helpers';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await getAuthSession();
  if (!userId) return unauthorizedResponse();

  try {
    const match = await prisma.match.findFirst({ where: { id: params.id, userId } });
    if (!match) return notFoundResponse('Match');

    // Find last delivery in active innings
    const lastDelivery = await prisma.delivery.findFirst({
      where: { innings: { matchId: params.id } },
      orderBy: [{ overNumber: 'desc' }, { ballNumber: 'desc' }, { timestamp: 'desc' }],
    });

    if (!lastDelivery) return badRequestResponse('No deliveries to undo');

    const isExtra = lastDelivery.isWide || lastDelivery.isNoBall;
    const isLegalBall = !lastDelivery.isWide && !lastDelivery.isNoBall;
    const extraRuns = isExtra ? 1 : 0;
    const totalBallRuns = lastDelivery.runs + extraRuns;

    await prisma.$transaction([
      // Delete delivery
      prisma.delivery.delete({ where: { id: lastDelivery.id } }),

      // Reverse innings totals
      prisma.innings.update({
        where: { id: lastDelivery.inningsId },
        data: {
          totalRuns: { decrement: totalBallRuns },
          totalWickets: { decrement: lastDelivery.isWicket ? 1 : 0 },
          extras: { decrement: isExtra ? 1 + lastDelivery.runs : 0 },
          wides: { decrement: lastDelivery.isWide ? 1 + lastDelivery.runs : 0 },
          noBalls: { decrement: lastDelivery.isNoBall ? 1 : 0 },
          legByes: { decrement: lastDelivery.isLegBye ? lastDelivery.runs : 0 },
          byes: { decrement: lastDelivery.isBye ? lastDelivery.runs : 0 },
          totalOvers: { decrement: isLegalBall ? 1 / 6 : 0 },
        },
      }),
    ]);

    const innings = await prisma.innings.findUnique({ where: { id: lastDelivery.inningsId } });

    await pusherServer.trigger(matchChannel(params.id), PUSHER_EVENTS.SCORE_UPDATE, { innings });

    return NextResponse.json({ success: true, innings });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
