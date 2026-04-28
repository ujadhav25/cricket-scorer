import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Sidebar, BottomNav, MobileHeader } from '@/components/layout/Navigation';
import { ClientNavigate } from '@/components/ClientNavigate';
import { PwaInstallPrompt } from '@/components/PwaInstallPrompt';
import { PushPermissionPrompt } from '@/components/PushPermissionPrompt';
import { getViewMode } from '@/lib/view-mode';

export const dynamic = 'force-dynamic';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const userId = session.user.id;

  const [user, roleRows] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    }),
    prisma.$queryRaw<{ role: string }[]>`
      SELECT role::text FROM "User" WHERE id = ${userId} LIMIT 1
    `.catch(() => [] as { role: string }[]),
  ]);

  if (!user) redirect('/login');

  const isSuperAdmin = roleRows[0]?.role === 'SUPER_ADMIN';

  // ── Resolve the user's "self" player (first player owned by this user) ──
  let player = await prisma.player.findFirst({
    where: { userId },
    select: { id: true, phone: true },
    orderBy: { createdAt: 'asc' },
  });

  if (!player) {
    // createUser event should have created this; only runs if it raced/failed.
    const playerName = user.name ?? session.user.name ?? user.email?.split('@')[0] ?? 'Player';
    try {
      player = await prisma.player.create({
        data: { userId, name: playerName },
        select: { id: true, phone: true },
      });
    } catch (e) {
      console.error('[layout] Failed to create self player:', e);
    }
  }

  const playerIncomplete = !player?.phone || player.phone.trim() === '';
  const editPath = player ? `/players/${player.id}/edit` : null;

  // View mode is read from cookie (default: 'player'). Force player view when
  // profile is incomplete so the user is always taken to the edit form.
  const activeView = playerIncomplete ? 'player' : getViewMode();

  return (
    <div className="flex h-screen overflow-hidden bg-mesh">
      {/* Redirect to edit only when in player view with incomplete profile */}
      {playerIncomplete && editPath && <ClientNavigate to={editPath} />}
      <Sidebar activeView={activeView} playerId={player?.id ?? null} playerIncomplete={playerIncomplete} isSuperAdmin={isSuperAdmin} />
      <main className="flex-1 overflow-y-auto pb-20 pt-12 md:pt-0 md:pb-0">
        {children}
      </main>
      <MobileHeader activeView={activeView} isSuperAdmin={isSuperAdmin} />
      <BottomNav activeView={activeView} playerId={player?.id ?? null} playerIncomplete={playerIncomplete} isSuperAdmin={isSuperAdmin} />
      <PushPermissionPrompt />
      <PwaInstallPrompt />
    </div>
  );
}
