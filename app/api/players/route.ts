import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import {
  getAuthSession,
  unauthorizedResponse,
  serverErrorResponse,
  badRequestResponse,
} from '@/lib/api-helpers';

const CreatePlayerSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  battingStyle: z.enum(['Right', 'Left']).default('Right'),
  bowlingStyle: z.enum(['Fast', 'Spin', 'Medium']).default('Medium'),
});

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
        userId,
        ...(search && { name: { contains: search, mode: 'insensitive' } }),
        ...(battingStyle && { battingStyle }),
        ...(bowlingStyle && { bowlingStyle }),
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(players);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await getAuthSession();
  if (!userId) return unauthorizedResponse();

  try {
    const body = await req.json();
    const parsed = CreatePlayerSchema.safeParse(body);
    if (!parsed.success) return badRequestResponse(parsed.error.message);

    const player = await prisma.player.create({
      data: { ...parsed.data, userId },
    });

    revalidatePath('/players');
    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
