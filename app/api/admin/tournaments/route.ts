import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

async function assertAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') return null;
  return session;
}

export async function GET(req: NextRequest) {
  const session = await assertAdmin();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = 20;
  const search = searchParams.get('q') ?? '';

  const where = search
    ? { name: { contains: search, mode: 'insensitive' as const } }
    : {};

  const [tournaments, total] = await Promise.all([
    prisma.tournament.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, name: true, format: true, status: true, createdAt: true, startDate: true, endDate: true,
        user: { select: { name: true, email: true } },
        _count: { select: { teams: true, matches: true } },
      },
    }),
    prisma.tournament.count({ where }),
  ]);

  return NextResponse.json({ tournaments, total, page, pages: Math.ceil(total / limit) });
}
