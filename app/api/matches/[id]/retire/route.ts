import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import {
  getAuthSession,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
  badRequestResponse,
} from '@/lib/api-helpers';

const RetireSchema = z.object({
  inningsId: z.string(),
  batsmanId: z.string(),
  retireType: z.enum(['RetiredHurt', 'RetiredOut']),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await getAuthSession();
  if (!userId) return unauthorizedResponse();

  try {
    const match = await prisma.match.findFirst({ where: { id: params.id, userId } });
    if (!match) return notFoundResponse('Match');

    const body = await req.json();
    const parsed = RetireSchema.safeParse(body);
    if (!parsed.success) return badRequestResponse(parsed.error.message);

    const { inningsId, batsmanId, retireType } = parsed.data;
    const isOut = retireType === 'RetiredOut';

    // Update or create BatterScore entry
    await prisma.batterScore.upsert({
      where: { inningsId_playerId: { inningsId, playerId: batsmanId } },
      create: {
        inningsId,
        playerId: batsmanId,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        isOut,
        dismissalType: retireType,
      },
      update: {
        isOut,
        dismissalType: retireType,
      },
    });

    // For RetiredOut, increment innings wicket count
    if (isOut) {
      await prisma.innings.update({
        where: { id: inningsId },
        data: { totalWickets: { increment: 1 } },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
