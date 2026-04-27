import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getAuthSession,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  const { userId } = await getAuthSession();
  if (!userId) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') ?? '';
    const battingStyle = searchParams.get('battingStyle');
    const bowlingStyle = searchParams.get('bowlingStyle');

    const players = await prisma.player.findMany({
      where: {
        teamPlayers: {
          some: { team: { userId } },
        },
        ...(search && { name: { contains: search, mode: 'insensitive' } }),
        ...(battingStyle && { battingStyle }),
        ...(bowlingStyle && { bowlingStyle }),
      },
      include: {
        teamPlayers: { include: { team: { select: { id: true, name: true } } } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(players);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
