import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { ScoringClient } from '@/components/scoring/ScoringClient';

export default async function ScorePage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const match = await prisma.match.findFirst({
    where: {
      id: params.id,
      userId: session.user.id,
    },
    include: {
      teamA: { include: { players: { include: { player: true } } } },
      teamB: { include: { players: { include: { player: true } } } },
      innings: {
        include: {
          deliveries: { orderBy: [{ overNumber: 'asc' }, { ballNumber: 'asc' }] },
          batterScores: { include: { player: true } },
          bowlerScores: { include: { player: true } },
          battingTeam: true,
        },
        orderBy: { inningsNumber: 'asc' },
      },
    },
  });

  if (!match) notFound();

  return <ScoringClient match={match} />;
}
