import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession, unauthorizedResponse, notFoundResponse, serverErrorResponse } from '@/lib/api-helpers';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await getAuthSession();
    if (!userId) return unauthorizedResponse();

    const match = await prisma.match.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    });
    if (!match) return notFoundResponse('Match');

    const { playerId } = await req.json();

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
