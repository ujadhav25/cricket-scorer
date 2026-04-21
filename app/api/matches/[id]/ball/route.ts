import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { pusherServer, matchChannel, PUSHER_EVENTS } from '@/lib/pusher';
import { sseHub } from '@/lib/sse';
import {
  getAuthSession,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
  badRequestResponse,
} from '@/lib/api-helpers';

const BallSchema = z.object({
  inningsId: z.string(),
  overNumber: z.number().int().min(0),
  ballNumber: z.number().int().min(1).max(6),
  batsmanId: z.string(),
  bowlerId: z.string(),
  runs: z.number().int().min(0).max(6),
  isWide: z.boolean().default(false),
  isNoBall: z.boolean().default(false),
  isLegBye: z.boolean().default(false),
  isBye: z.boolean().default(false),
  isWicket: z.boolean().default(false),
  wicketType: z.string().optional(),
  fielderId: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await getAuthSession();
  if (!userId) return unauthorizedResponse();

  try {
    const body = await req.json();
    const parsed = BallSchema.safeParse(body);
    if (!parsed.success) return badRequestResponse(parsed.error.message);

    // Verify match ownership
    const match = await prisma.match.findFirst({
      where: { id: params.id, userId },
    });
    if (!match) return notFoundResponse('Match');

    const ballData = parsed.data;

    // A batsman cannot also be the bowler
    if (ballData.bowlerId === ballData.batsmanId) {
      return badRequestResponse('A batsman cannot bowl in the same ball');
    }

    // Server-side enforcement: same bowler cannot bowl consecutive overs
    if (ballData.overNumber > 0) {
      const prevOverBowler = await prisma.delivery.findFirst({
        where: {
          inningsId: ballData.inningsId,
          overNumber: ballData.overNumber - 1,
          isWide: false,
          isNoBall: false,
        },
        select: { bowlerId: true },
      });
      if (prevOverBowler?.bowlerId === ballData.bowlerId) {
        return badRequestResponse('The same bowler cannot bowl consecutive overs');
      }
    }

    // Record delivery
    const delivery = await prisma.delivery.create({ data: ballData });

    // Update innings totals
    const isExtra = ballData.isWide || ballData.isNoBall;
    const isLegalBall = !ballData.isWide && !ballData.isNoBall;
    const extraRuns = (ballData.isWide || ballData.isNoBall) ? 1 : 0;
    const totalBallRuns = ballData.runs + extraRuns;

    // Update innings aggregates
    const innings = await prisma.innings.update({
      where: { id: ballData.inningsId },
      data: {
        totalRuns: { increment: totalBallRuns },
        totalWickets: { increment: ballData.isWicket ? 1 : 0 },
        extras: { increment: isExtra ? 1 + ballData.runs : 0 },
        wides: { increment: ballData.isWide ? 1 + ballData.runs : 0 },
        noBalls: { increment: ballData.isNoBall ? 1 : 0 },
        legByes: { increment: ballData.isLegBye ? ballData.runs : 0 },
        byes: { increment: ballData.isBye ? ballData.runs : 0 },
        ...(isLegalBall && {
          totalOvers: {
            increment:
              ballData.ballNumber === 6
                ? 1 - (ballData.ballNumber - 1) / 6
                : 1 / 6,
          },
        }),
      },
    });

    // Upsert batter score
    const batterRuns = ballData.isLegBye || ballData.isBye ? 0 : ballData.runs;
    await prisma.batterScore.upsert({
      where: { inningsId_playerId: { inningsId: ballData.inningsId, playerId: ballData.batsmanId } },
      create: {
        inningsId: ballData.inningsId,
        playerId: ballData.batsmanId,
        runs: batterRuns,
        balls: isLegalBall ? 1 : 0,
        fours: batterRuns === 4 ? 1 : 0,
        sixes: batterRuns === 6 ? 1 : 0,
        isOut: ballData.isWicket,
        dismissalType: ballData.wicketType,
      },
      update: {
        runs: { increment: batterRuns },
        balls: { increment: isLegalBall ? 1 : 0 },
        fours: { increment: batterRuns === 4 ? 1 : 0 },
        sixes: { increment: batterRuns === 6 ? 1 : 0 },
        ...(ballData.isWicket && {
          isOut: true,
          dismissalType: ballData.wicketType,
          dismissedById: ballData.fielderId,
        }),
      },
    });

    // Upsert bowler score
    await prisma.bowlerScore.upsert({
      where: { inningsId_playerId: { inningsId: ballData.inningsId, playerId: ballData.bowlerId } },
      create: {
        inningsId: ballData.inningsId,
        playerId: ballData.bowlerId,
        overs: isLegalBall ? 1 / 6 : 0,
        runs: totalBallRuns,
        wickets: ballData.isWicket && !['RunOut'].includes(ballData.wicketType ?? '') ? 1 : 0,
      },
      update: {
        overs: { increment: isLegalBall ? 1 / 6 : 0 },
        runs: { increment: totalBallRuns },
        wickets: {
          increment:
            ballData.isWicket && !['RunOut'].includes(ballData.wicketType ?? '') ? 1 : 0,
        },
      },
    });

    // Update match status to LIVE
    await prisma.match.update({
      where: { id: params.id },
      data: { status: 'LIVE' },
    });

    // Push real-time update via SSE
    sseHub.emit(params.id, 'update');

    // Also try Pusher if configured (non-fatal)
    try {
      await pusherServer.trigger(matchChannel(params.id), PUSHER_EVENTS.BALL_RECORDED, {
        delivery,
        innings,
      });
    } catch (_pusherErr) {
      // Pusher not configured — SSE handles it
    }

    return NextResponse.json({ delivery, innings });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
