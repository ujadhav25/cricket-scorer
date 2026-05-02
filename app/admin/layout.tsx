import { adminAuth } from '@/lib/admin-auth';
import { adminSignOut } from '@/lib/admin-auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
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
  BarChart2,
} from 'lucide-react';

const NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/players', label: 'Players', icon: UserCircle },
  { href: '/admin/teams', label: 'Teams', icon: Shield },
  { href: '/admin/matches', label: 'Matches', icon: Activity },
  { href: '/admin/tournaments', label: 'Tournaments', icon: Trophy },
  { href: '/admin/admins', label: 'Admin Users', icon: ShieldAlert },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = headers().get('x-pathname') ?? '';

  // Login page lives inside this layout directory but must not trigger auth check
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const session = await adminAuth();
  const admin = (session as any)?.admin;
  if (!admin) redirect('/admin/login');

  const adminName = admin.name ?? admin.email ?? 'Admin';

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 flex-col bg-card/80 border-r border-border/20 shrink-0">
        <div className="flex h-14 items-center gap-2 px-4 border-b border-border/15">
          <ShieldAlert className="h-5 w-5 text-red-400 shrink-0" />
          <span className="font-bold text-sm text-red-400 truncate">Super Admin</span>
          <div className="ml-auto"><ThemeToggle /></div>
        </div>
        {/* Logged-in identity */}
        <div className="px-3 py-2.5 border-b border-border/10">
          <p className="text-[11px] text-muted-foreground/60 mb-0.5">Logged in as</p>
          <p className="text-xs font-medium truncate text-foreground/80">{adminName}</p>
          {admin.department && (
            <p className="text-[10px] text-muted-foreground/50 truncate">{admin.department}</p>
          )}
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
        <div className="p-2 border-t border-border/15 space-y-1">
          <form action="/api/admin/auth/signout" method="POST">
            <input type="hidden" name="callbackUrl" value="/admin/login" />
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex flex-col flex-1 min-w-0">
        <header className="md:hidden flex items-center gap-3 px-4 h-12 border-b border-border/20 bg-card/80">
          <ShieldAlert className="h-4 w-4 text-red-400" />
          <span className="text-sm font-bold text-red-400">Admin</span>
          <nav className="flex gap-1 overflow-x-auto">
            {NAV.map(({ href, label }) => (
              <Link key={href} href={href} className="shrink-0 text-xs px-2 py-1 rounded text-muted-foreground hover:text-foreground">
                {label}
              </Link>
            ))}
          </nav>
          <form action="/api/admin/auth/signout" method="POST" className="ml-auto shrink-0">
            <input type="hidden" name="callbackUrl" value="/admin/login" />
            <button
              type="submit"
              className="text-xs font-medium text-red-400 border border-red-500/30 rounded-full px-2.5 py-1 hover:bg-red-500/10 transition-colors"
            >
              Sign Out
            </button>
          </form>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
