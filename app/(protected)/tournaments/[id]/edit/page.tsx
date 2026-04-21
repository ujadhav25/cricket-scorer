import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import TournamentEditClient from './TournamentEditClient';

export default async function TournamentEditPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const tournament = await prisma.tournament.findFirst({
    where: { id: params.id, userId: session.user.id },
    select: { id: true, name: true, defaultOvers: true, format: true, startDate: true, endDate: true },
  });

  if (!tournament) notFound();

  return <TournamentEditClient tournament={{
    ...tournament,
    overs: tournament.defaultOvers,
    startDate: tournament.startDate?.toISOString() ?? null,
    endDate: tournament.endDate?.toISOString() ?? null,
  }} />;
}
