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
      teamA: {
        include: {
          players: {
            include: { player: true },
            // Filter will be applied below after fetching match
          },
        },
      },
      teamB: {
        include: {
          players: {
            include: { player: true },
          },
        },
      },
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

  // If a playing XI was selected at match creation, restrict to those players only
  const filteredMatch = {
    ...match,
    teamA: {
      ...match.teamA,
      players: (match.playingXI_A ?? []).length > 0
        ? match.teamA.players.filter((tp) => (match.playingXI_A ?? []).includes(tp.player.id))
        : match.teamA.players,
    },
    teamB: {
      ...match.teamB,
      players: (match.playingXI_B ?? []).length > 0
        ? match.teamB.players.filter((tp) => (match.playingXI_B ?? []).includes(tp.player.id))
        : match.teamB.players,
    },
  };

  return <ScoringClient match={filteredMatch} />;
}
