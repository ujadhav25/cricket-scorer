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

  const [teams, total] = await Promise.all([
    prisma.team.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, name: true, color: true, homeGround: true, createdAt: true,
        user: { select: { name: true, email: true } },
        _count: { select: { players: true, matchesAsTeamA: true, matchesAsTeamB: true } },
      },
    }),
    prisma.team.count({ where }),
  ]);

  return NextResponse.json({ teams, total, page, pages: Math.ceil(total / limit) });
}
