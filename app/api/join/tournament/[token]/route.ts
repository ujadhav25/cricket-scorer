import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession, unauthorizedResponse } from '@/lib/api-helpers';

const JoinTournamentSchema = z.object({
  teamId: z.string().min(1),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const tournament = await prisma.tournament.findUnique({
    where: { joinToken: params.token },
    select: {
      id: true,
      name: true,
      format: true,
      startDate: true,
      endDate: true,
      status: true,
      defaultOvers: true,
      teams: { include: { team: { select: { id: true, name: true, color: true } } } },
    },
  });
  if (!tournament) return NextResponse.json({ error: 'Invalid join link' }, { status: 404 });
  return NextResponse.json(tournament);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { userId } = await getAuthSession();
  if (!userId) return unauthorizedResponse();

  try {
    const tournament = await prisma.tournament.findUnique({
      where: { joinToken: params.token },
      include: { teams: true },
    });
    if (!tournament) return NextResponse.json({ error: 'Invalid join link' }, { status: 404 });

    const body = await req.json();
    const parsed = JoinTournamentSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

    // Verify user owns or captains this team
    const team = await prisma.team.findFirst({
      where: {
        id: parsed.data.teamId,
        OR: [{ userId }, { captainUserId: userId }],
      },
    });
    if (!team) return NextResponse.json({ error: 'Team not found or unauthorized' }, { status: 403 });

    const alreadyIn = tournament.teams.some((tt) => tt.teamId === parsed.data.teamId);
    if (alreadyIn) return NextResponse.json({ error: 'Team is already in this tournament' }, { status: 409 });

    await prisma.tournamentTeam.create({
      data: { tournamentId: tournament.id, teamId: parsed.data.teamId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
