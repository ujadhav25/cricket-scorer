import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getAuthSession,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
  matchMemberFilter,
} from '@/lib/api-helpers';

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
