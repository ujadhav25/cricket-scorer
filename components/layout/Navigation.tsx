'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Shield,
  Activity,
  Trophy,
  History,
  Settings,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/players', label: 'Players', icon: Users },
  { href: '/teams', label: 'Teams', icon: Shield },
  { href: '/matches', label: 'Matches', icon: Activity },
  { href: '/tournaments', label: 'Tournaments', icon: Trophy },
  { href: '/history', label: 'History', icon: History },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card md:flex">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl">🏏</span>
          <span className="text-lg font-bold text-cricket-green">CricScorer</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              pathname.startsWith(href)
                ? 'bg-cricket-green/20 text-cricket-green'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const items = NAV_ITEMS.slice(0, 5); // Show only first 5 on mobile

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 border-t border-border bg-card md:hidden">
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors',
            pathname.startsWith(href)
              ? 'text-cricket-green'
              : 'text-muted-foreground'
          )}
        >
          <Icon className="h-5 w-5" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
