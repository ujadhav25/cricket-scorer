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

const UpdatePlayerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  phone: z.string().min(1, 'Phone is required'),
  avatarUrl: z.string().url().optional().nullable(),
  battingStyle: z.enum(['Right', 'Left']),
  bowlingStyle: z.enum(['Fast', 'Spin', 'Medium']),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await getAuthSession();
  if (!userId) return unauthorizedResponse();

  try {
    const player = await prisma.player.findFirst({
      where: { id: params.id, userId },
      include: {
        user: { select: { email: true } },
        batterScores: {
          include: { innings: { include: { match: { include: { teamA: true, teamB: true } } } } },
          orderBy: { innings: { createdAt: 'desc' } },
          take: 20,
        },
        bowlerScores: {
          include: { innings: { include: { match: { include: { teamA: true, teamB: true } } } } },
          orderBy: { innings: { createdAt: 'desc' } },
          take: 20,
        },
      },
    });

    if (!player) return notFoundResponse('Player');
    return NextResponse.json(player);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await getAuthSession();
  if (!userId) return unauthorizedResponse();

  try {
    const body = await req.json();
    const parsed = UpdatePlayerSchema.safeParse(body);
    if (!parsed.success) return badRequestResponse(parsed.error.message);

    // Find by id only first, then verify ownership
    const player = await prisma.player.findUnique({ where: { id: params.id } });
    if (!player) return notFoundResponse('Player');
    if (player.userId !== userId) return unauthorizedResponse();

    const updated = await prisma.player.update({
      where: { id: params.id },
      data: parsed.data,
    });

    return NextResponse.json(updated);
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
    const player = await prisma.player.findFirst({
      where: { id: params.id, userId },
    });
    if (!player) return notFoundResponse('Player');

    await prisma.player.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
