import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import {
  getAuthSession,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
  badRequestResponse,
  teamMemberFilter,
} from '@/lib/api-helpers';

const UpdateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  homeGround: z.string().optional().nullable(),
  playerIds: z.array(z.string()).min(2).max(15).optional(),
  captainEmail: z.string().email().optional().nullable(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await getAuthSession();
  if (!userId) return unauthorizedResponse();

  try {
    const team = await prisma.team.findFirst({
      where: { id: params.id, ...teamMemberFilter(userId) },
      include: {
        players: { include: { player: true } },
        captainUser: { select: { id: true, name: true, email: true } },
        matchesAsTeamA: { include: { teamB: true }, orderBy: { createdAt: 'desc' }, take: 10 },
        matchesAsTeamB: { include: { teamA: true }, orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });

    if (!team) return notFoundResponse('Team');
    return NextResponse.json(team);
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
    const parsed = UpdateTeamSchema.safeParse(body);
    if (!parsed.success) return badRequestResponse(parsed.error.message);

    // Owner OR captain can update player list; only owner can rename/recolor
    const team = await prisma.team.findFirst({
      where: { id: params.id, OR: [{ userId }, { captainUserId: userId }] },
    });
    if (!team) return notFoundResponse('Team');

    const { playerIds, captainEmail, ...teamData } = parsed.data;

    // Resolve captainEmail → captainUserId (only owner can change captain)
    let captainUserId: string | null | undefined = undefined;
    if (captainEmail !== undefined && team.userId === userId) {
      if (captainEmail === null || captainEmail === '') {
        captainUserId = null;
      } else {
        const captainUser = await prisma.user.findUnique({ where: { email: captainEmail }, select: { id: true } });
        captainUserId = captainUser?.id ?? null;
      }
    }

    const updated = await prisma.team.update({
      where: { id: params.id },
      data: {
        // Captain can only update players; owner can update everything
        ...(team.userId === userId ? teamData : {}),
        ...(captainUserId !== undefined ? { captainUserId } : {}),
        ...(playerIds && {
          players: {
            deleteMany: {},
            create: playerIds.map((playerId) => ({ playerId })),
          },
        }),
      },
      include: { players: { include: { player: true } } },
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
    const team = await prisma.team.findFirst({ where: { id: params.id, userId } });
    if (!team) return notFoundResponse('Team');

    await prisma.team.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
