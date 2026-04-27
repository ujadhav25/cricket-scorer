import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { PlayerEditForm } from '@/components/PlayerEditForm';
import { getViewMode } from '@/lib/view-mode';

export const dynamic = 'force-dynamic';

export default async function EditPlayerPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  // Organizers cannot edit players — only players can edit their own profile
  if (getViewMode() === 'organizer') redirect(`/players/${params.id}`);

  // Resolve the user's self player (first player owned by this user)
  const userRecord = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });

  const selfPlayer = await prisma.player.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  // If URL id doesn't match the user's self player, redirect to the correct one
  if (selfPlayer && selfPlayer.id !== params.id) {
    redirect(`/players/${selfPlayer.id}/edit`);
  }

  const player = selfPlayer
    ? await prisma.player.findUnique({
        where: { id: selfPlayer.id },
        include: { user: { select: { email: true } } },
      })
    : null;

  if (!player) redirect('/dashboard');

  return (
    <PlayerEditForm
      id={player.id}
      email={player.user?.email ?? userRecord?.email ?? ''}
      defaultValues={{
        name: player.name,
        phone: player.phone ?? '',
        battingStyle: (player.battingStyle as 'Right' | 'Left') ?? 'Right',
        bowlingStyle: (player.bowlingStyle as 'Fast' | 'Medium' | 'Spin') ?? 'Medium',
      }}
    />
  );
}

