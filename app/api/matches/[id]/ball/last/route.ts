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
    const batterRuns = lastDelivery.isLegBye || lastDelivery.isBye ? 0 : lastDelivery.runs;

    const ballExtras = (lastDelivery.isWide ? 1 + lastDelivery.runs : 0)
      + (lastDelivery.isNoBall ? 1 : 0)
      + (lastDelivery.isLegBye ? lastDelivery.runs : 0)
      + (lastDelivery.isBye ? lastDelivery.runs : 0);

    await prisma.$transaction([
      // Delete delivery
      prisma.delivery.delete({ where: { id: lastDelivery.id } }),

      // Reverse innings totals
      prisma.innings.update({
        where: { id: lastDelivery.inningsId },
        data: {
          totalRuns: { decrement: totalBallRuns },
          totalWickets: { decrement: lastDelivery.isWicket ? 1 : 0 },
          extras: { decrement: ballExtras },
          wides: { decrement: lastDelivery.isWide ? 1 + lastDelivery.runs : 0 },
          noBalls: { decrement: lastDelivery.isNoBall ? 1 : 0 },
          legByes: { decrement: lastDelivery.isLegBye ? lastDelivery.runs : 0 },
          byes: { decrement: lastDelivery.isBye ? lastDelivery.runs : 0 },
          totalOvers: { decrement: isLegalBall ? 1 / 6 : 0 },
        },
      }),

      // Reverse batter score
      prisma.batterScore.update({
        where: { inningsId_playerId: { inningsId: lastDelivery.inningsId, playerId: lastDelivery.batsmanId } },
        data: {
          runs: { decrement: batterRuns },
          balls: { decrement: isLegalBall ? 1 : 0 },
          fours: { decrement: batterRuns === 4 ? 1 : 0 },
          sixes: { decrement: batterRuns === 6 ? 1 : 0 },
          ...(lastDelivery.isWicket && { isOut: false, dismissalType: null, dismissedById: null }),
        },
      }),

      // Reverse bowler score
      prisma.bowlerScore.update({
        where: { inningsId_playerId: { inningsId: lastDelivery.inningsId, playerId: lastDelivery.bowlerId } },
        data: {
          overs: { decrement: isLegalBall ? 1 / 6 : 0 },
          runs: { decrement: totalBallRuns },
          wickets: {
            decrement: lastDelivery.isWicket && !['RunOut'].includes(lastDelivery.wicketType ?? '') ? 1 : 0,
          },
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
