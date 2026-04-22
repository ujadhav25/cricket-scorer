import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession, unauthorizedResponse, notFoundResponse, badRequestResponse, serverErrorResponse } from '@/lib/api-helpers';
import { z } from 'zod';

const CreateGroupSchema = z.object({
  name: z.string().min(1).max(50),
  teamIds: z.array(z.string()).min(2),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await getAuthSession();
  if (!userId) return unauthorizedResponse();

  const groups = await prisma.tournamentGroup.findMany({
    where: { tournamentId: params.id },
    include: { teams: { include: { team: true } } },
    orderBy: { groupOrder: 'asc' },
  });

  return NextResponse.json(groups);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await getAuthSession();
  if (!userId) return unauthorizedResponse();

  const tournament = await prisma.tournament.findFirst({
    where: { id: params.id, userId },
  });
  if (!tournament) return notFoundResponse('Tournament');

  const body = await req.json();
  const result = CreateGroupSchema.safeParse(body);
  if (!result.success) return badRequestResponse(result.error.message);

  const { name, teamIds } = result.data;

  try {
    const maxOrder = await prisma.tournamentGroup.aggregate({
      where: { tournamentId: params.id },
      _max: { groupOrder: true },
    });

    const group = await prisma.tournamentGroup.create({
      data: {
        tournamentId: params.id,
        name,
        groupOrder: (maxOrder._max.groupOrder ?? 0) + 1,
        teams: {
          create: teamIds.map((teamId) => ({ teamId })),
        },
      },
      include: { teams: { include: { team: true } } },
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await getAuthSession();
  if (!userId) return unauthorizedResponse();

  const tournament = await prisma.tournament.findFirst({
    where: { id: params.id, userId },
  });
  if (!tournament) return notFoundResponse('Tournament');

  const { groupId } = await req.json();
  if (!groupId) return badRequestResponse('groupId required');

  await prisma.tournamentGroup.delete({ where: { id: groupId } });

  return NextResponse.json({ success: true });
}
