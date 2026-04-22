'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
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
    <aside className="hidden w-64 shrink-0 flex-col md:flex bg-gradient-to-b from-card/95 via-card/90 to-card/80 backdrop-blur-xl border-r border-border/20">
      <div className="flex h-16 items-center border-b border-border/15 px-6">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <span className="text-2xl transition-transform duration-300 group-hover:rotate-12">🏏</span>
          <span className="text-lg font-bold text-gradient">CricScorer</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-3 pt-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-cricket-green-600 to-cricket-green-500 shadow-lg shadow-cricket-green-500/20"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-3">
                <Icon className="h-[18px] w-[18px]" />
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-border/20 space-y-2">
        <div className="rounded-xl bg-gradient-to-br from-cricket-green-500/10 to-cricket-amber-500/10 p-3">
          <p className="text-xs font-medium text-foreground/80">Pro Tip</p>
          <p className="text-xs text-muted-foreground mt-0.5">Share live scores with spectators via public links</p>
        </div>
        <p className="text-center text-[10px] text-muted-foreground/30 tabular-nums">
          v{process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0'}
        </p>
      </div>
    </aside>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const items = NAV_ITEMS.slice(0, 5);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-strong md:hidden">
      <div className="flex h-16 items-stretch">
        {items.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
                isActive
                  ? 'text-cricket-green'
                  : 'text-muted-foreground'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="bottomnav-active"
                  className="absolute -top-px left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-cricket-green-400 to-cricket-green-500"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                />
              )}
              <Icon className={cn('h-5 w-5 transition-transform', isActive && 'scale-110')} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
