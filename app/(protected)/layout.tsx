import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Sidebar, BottomNav } from '@/components/layout/Navigation';
import { PwaInstallPrompt } from '@/components/PwaInstallPrompt';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="flex h-screen overflow-hidden bg-mesh">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {children}
      </main>
      <BottomNav />
      <PwaInstallPrompt />
    </div>
  );
}
