import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { assertAdmin } from '@/lib/assert-admin';

export async function GET() {
  const admin = await assertAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [
    totalUsers,
    totalPlayers,
    totalTeams,
    totalMatches,
    totalTournaments,
    completedMatches,
    liveMatches,
    recentUsers,
    matchesByDay,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.player.count(),
    prisma.team.count(),
    prisma.match.count(),
    prisma.tournament.count(),
    prisma.match.count({ where: { status: 'COMPLETED' } }),
    prisma.match.count({ where: { status: 'LIVE' } }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, email: true, role: true, createdAt: true, image: true },
    }),
    prisma.match.groupBy({
      by: ['createdAt'],
      _count: { id: true },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
  ]);

  return NextResponse.json({
    totalUsers,
    totalPlayers,
    totalTeams,
    totalMatches,
    totalTournaments,
    completedMatches,
    liveMatches,
    recentUsers,
    matchesByDay,
  });
}
