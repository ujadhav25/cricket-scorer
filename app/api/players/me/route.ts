import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession, unauthorizedResponse, serverErrorResponse } from '@/lib/api-helpers';

// Returns the current user's own player record (the first one linked to their userId)
export async function GET() {
  const { userId } = await getAuthSession();
  if (!userId) return unauthorizedResponse();

  try {
    const player = await prisma.player.findFirst({
      where: { userId },
      select: { id: true, name: true, phone: true, battingStyle: true, bowlingStyle: true },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(player ?? null);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
