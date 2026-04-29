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
  const status = searchParams.get('status') ?? '';

  const where: any = {};
  if (search) where.OR = [
    { teamA: { name: { contains: search, mode: 'insensitive' } } },
    { teamB: { name: { contains: search, mode: 'insensitive' } } },
    { venue: { contains: search, mode: 'insensitive' } },
  ];
  if (status) where.status = status;

  const [matches, total] = await Promise.all([
    prisma.match.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, status: true, overs: true, venue: true, createdAt: true, matchType: true,
        teamA: { select: { name: true, color: true } },
        teamB: { select: { name: true, color: true } },
        user: { select: { name: true, email: true } },
        innings: { select: { totalRuns: true, totalWickets: true, inningsNumber: true, battingTeamId: true } },
      },
    }),
    prisma.match.count({ where }),
  ]);

  return NextResponse.json({ matches, total, page, pages: Math.ceil(total / limit) });
}
