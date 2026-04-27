import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';

interface Props {
  params: { token: string };
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const team = await prisma.team.findUnique({
    where: { joinToken: params.token },
    select: { name: true, color: true, homeGround: true, _count: { select: { players: true } } },
  });

  if (!team) {
    return { title: 'Team Not Found' };
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000');

  const ogImageUrl = `${appUrl}/api/og/team/${params.token}`;
  const playerCount = team._count.players;
  const description = `Join ${team.name} on CricScorer${team.homeGround ? ` · ${team.homeGround}` : ''} · ${playerCount} ${playerCount === 1 ? 'player' : 'players'} so far`;

  return {
    title: `Join ${team.name}`,
    description,
    openGraph: {
      title: `Join ${team.name} on CricScorer`,
      description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${team.name} team invite`,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Join ${team.name} on CricScorer`,
      description,
      images: [ogImageUrl],
    },
  };
}

export default function JoinTeamLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
