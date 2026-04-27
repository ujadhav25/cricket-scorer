import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession, unauthorizedResponse, serverErrorResponse } from '@/lib/api-helpers';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; playerId: string } }
) {
  const { userId } = await getAuthSession();
  if (!userId) return unauthorizedResponse();

  try {
    // Only the team owner or captain can remove players
    const team = await prisma.team.findFirst({
      where: {
        id: params.id,
        OR: [{ userId }, { captainUserId: userId }],
      },
    });
    if (!team) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    await prisma.teamPlayer.deleteMany({
      where: { teamId: params.id, playerId: params.playerId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
