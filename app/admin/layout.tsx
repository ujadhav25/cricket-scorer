import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  LayoutDashboard,
  Users,
  Shield,
  Activity,
  Trophy,
  UserCircle,
  LogOut,
  ShieldAlert,
} from 'lucide-react';

const NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/players', label: 'Players', icon: UserCircle },
  { href: '/admin/teams', label: 'Teams', icon: Shield },
  { href: '/admin/matches', label: 'Matches', icon: Activity },
  { href: '/admin/tournaments', label: 'Tournaments', icon: Trophy },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 flex-col bg-card/80 border-r border-border/20 shrink-0">
        <div className="flex h-14 items-center gap-2 px-4 border-b border-border/15">
          <ShieldAlert className="h-5 w-5 text-red-400" />
          <span className="font-bold text-sm text-red-400">Super Admin</span>
          <div className="ml-auto"><ThemeToggle /></div>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-colors"
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-2 border-t border-border/15">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Back to App
          </Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex flex-col flex-1 min-w-0">
        <header className="md:hidden flex items-center gap-3 px-4 h-12 border-b border-border/20 bg-card/80">
          <ShieldAlert className="h-4 w-4 text-red-400" />
          <span className="text-sm font-bold text-red-400">Admin</span>
          <nav className="flex gap-1 overflow-x-auto ml-auto">
            {NAV.map(({ href, label }) => (
              <Link key={href} href={href} className="shrink-0 text-xs px-2 py-1 rounded text-muted-foreground hover:text-foreground">
                {label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
