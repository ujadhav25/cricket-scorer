import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { assertAdmin } from '@/lib/assert-admin';

export async function GET(req: NextRequest) {
  const admin = await assertAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = 20;
  const search = searchParams.get('q') ?? '';

  const where = search
    ? { name: { contains: search, mode: 'insensitive' as const } }
    : {};

  const [players, total] = await Promise.all([
    prisma.player.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, name: true, battingStyle: true, bowlingStyle: true, createdAt: true, avatarUrl: true,
        user: { select: { name: true, email: true } },
        _count: { select: { teamPlayers: true, batterScores: true } },
      },
    }),
    prisma.player.count({ where }),
  ]);

  return NextResponse.json({ players, total, page, pages: Math.ceil(total / limit) });
}
