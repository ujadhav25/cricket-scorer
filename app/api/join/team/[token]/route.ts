import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/api-helpers';

const JoinTeamSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().optional(),
  battingStyle: z.enum(['Right', 'Left']).default('Right'),
  bowlingStyle: z.enum(['Fast', 'Spin', 'Medium']).default('Medium'),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const team = await prisma.team.findUnique({
    where: { joinToken: params.token },
    select: {
      name: true,
      color: true,
      homeGround: true,
      _count: { select: { players: true } },
    },
  });
  if (!team) return NextResponse.json({ error: 'Invalid invite link' }, { status: 404 });
  return NextResponse.json(team);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  // Require login — the player is created under the joining user's own account
  const { userId } = await getAuthSession();
  if (!userId) return NextResponse.json({ error: 'You must be signed in to join a team' }, { status: 401 });

  try {
    const team = await prisma.team.findUnique({
      where: { joinToken: params.token },
    });
    if (!team) return NextResponse.json({ error: 'Invalid invite link' }, { status: 404 });

    const body = await req.json();
    const parsed = JoinTeamSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

    const { name, phone, battingStyle, bowlingStyle } = parsed.data;

    // Dedup: if this user already has a player in this team, reject
    const alreadyMember = await prisma.teamPlayer.findFirst({
      where: {
        teamId: team.id,
        player: { userId },
      },
    });
    if (alreadyMember) {
      return NextResponse.json({ error: 'You are already a member of this team', code: 'ALREADY_MEMBER' }, { status: 409 });
    }

    // Use existing player record if available, otherwise create one
    let player = await prisma.player.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    if (player) {
      // Update existing player with provided details, then add to team
      player = await prisma.player.update({
        where: { id: player.id },
        data: {
          name,
          phone: phone ?? player.phone,
          battingStyle,
          bowlingStyle,
          teamPlayers: { create: { teamId: team.id } },
        },
      });
    } else {
      // Dedup by phone within same team (only for new players)
      if (phone) {
        const existing = await prisma.player.findFirst({
          where: { phone },
          include: { teamPlayers: { where: { teamId: team.id } } },
        });
        if (existing?.teamPlayers.length) {
          return NextResponse.json(
            { error: 'A player with this phone number is already in the team', code: 'PHONE_EXISTS' },
            { status: 409 }
          );
        }
      }
      player = await prisma.player.create({
        data: {
          userId,
          name,
          phone: phone ?? null,
          battingStyle,
          bowlingStyle,
          teamPlayers: { create: { teamId: team.id } },
        },
      });
    }

    return NextResponse.json({ success: true, player: { id: player.id, name: player.name } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
