'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Shield,
  Activity,
  Trophy,
  History,
  Settings,
  User,
  ArrowLeftRight,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { AlertCircle } from 'lucide-react';

const ORGANIZER_NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/players', label: 'Players', icon: Users },
  { href: '/teams', label: 'Teams', icon: Shield },
  { href: '/matches', label: 'Matches', icon: Activity },
  { href: '/tournaments', label: 'Tournaments', icon: Trophy },
  { href: '/history', label: 'History', icon: History },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface NavProps {
  activeView: 'organizer' | 'player';
  playerId?: string | null;
  playerIncomplete?: boolean;
}

function getNavItems(activeView: 'organizer' | 'player', playerId?: string | null, playerIncomplete?: boolean) {
  if (activeView === 'player') {
    return [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ...(playerId
        ? [{ href: playerIncomplete ? `/players/${playerId}/edit` : `/players/${playerId}`, label: 'My Profile', icon: User }]
        : []),
      { href: '/teams', label: 'Teams', icon: Shield },
      { href: '/history', label: 'History', icon: History },
      { href: '/settings', label: 'Settings', icon: Settings },
    ];
  }
  return ORGANIZER_NAV;
}

function ViewSwitchButton({ activeView }: { activeView: 'organizer' | 'player' }) {
  const [open, setOpen] = useState(false);

  const next = activeView === 'organizer' ? 'player' : 'organizer';
  const label = activeView === 'organizer' ? 'Switch to Player' : 'Switch to Organizer';
  const nextLabel = next === 'organizer' ? 'Organizer' : 'Player';

  function handleConfirm() {
    setOpen(false);
    // Set cookie directly in browser — no server round-trip, takes effect immediately
    const oneYear = 60 * 60 * 24 * 365;
    const secure = window.location.protocol === 'https:' ? '; secure' : '';
    document.cookie = `view-mode=${next}; path=/; max-age=${oneYear}; samesite=lax${secure}`;
    window.location.href = '/dashboard';
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
          'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
        )}
      >
        <ArrowLeftRight className="h-[18px] w-[18px] shrink-0" />
        <span>{label}</span>
        <span className={cn(
          'ml-auto text-[10px] font-semibold rounded-full px-1.5 py-0.5',
          activeView === 'organizer'
            ? 'bg-cricket-green-500/20 text-cricket-green'
            : 'bg-blue-500/20 text-blue-400'
        )}>
          {activeView === 'organizer' ? 'ORG' : 'PLR'}
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Switch to {nextLabel} View?</DialogTitle>
            <DialogDescription>
              You are switching to the <span className="font-semibold text-foreground">{nextLabel}</span> view.
              {next === 'player' ? ' You will see your player profile and stats.' : ' You will see your organizer dashboard, matches, teams, and tournaments.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={handleConfirm}
              className={next === 'organizer' ? 'bg-cricket-green hover:bg-cricket-green/90' : 'bg-blue-600 hover:bg-blue-700'}
            >
              {`Yes, Switch to ${nextLabel}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function MobileHeader({ activeView }: { activeView: 'organizer' | 'player' }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex h-12 items-center justify-between px-4 glass-strong border-b border-border/20 md:hidden">
      <Link href="/dashboard" className="flex items-center gap-2">
        <span className="text-lg">🏏</span>
        <span className="text-sm font-bold text-gradient">CricScorer</span>
      </Link>
      <div className="flex items-center gap-2">
        <span className={cn(
          'text-[10px] font-bold rounded-full px-1.5 py-0.5',
          activeView === 'organizer'
            ? 'bg-cricket-green-500/20 text-cricket-green'
            : 'bg-blue-500/20 text-blue-400'
        )}>
          {activeView === 'organizer' ? 'ORG' : 'PLR'}
        </span>
        <ThemeToggle />
      </div>
    </header>
  );
}

export function Sidebar({ activeView, playerId, playerIncomplete }: NavProps) {
  const pathname = usePathname();
  const navItems = getNavItems(activeView, playerId, playerIncomplete);

  return (
    <aside className="hidden w-64 shrink-0 flex-col md:flex bg-gradient-to-b from-card/95 via-card/90 to-card/80 backdrop-blur-xl border-r border-border/20">
      <div className="flex h-16 items-center justify-between border-b border-border/15 px-6">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <span className="text-2xl transition-transform duration-300 group-hover:rotate-12">🏏</span>
          <span className="text-lg font-bold text-gradient">CricScorer</span>
        </Link>
        <ThemeToggle />
      </div>

      {playerIncomplete && (
        <div className="mx-3 mt-3 flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2.5">
          <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-300 leading-snug">
            Complete your player profile to unlock all features.
          </p>
        </div>
      )}

      <nav className="flex-1 space-y-1 p-3 pt-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          const isLocked = playerIncomplete && !href.endsWith('/edit');
          return isLocked ? (
            <span
              key={href}
              title="Complete your player profile first"
              className="relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground/30 cursor-not-allowed select-none"
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
            </span>
          ) : (
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
      <div className="p-3 border-t border-border/20 space-y-1">
        {!playerIncomplete && <ViewSwitchButton activeView={activeView} />}
        <p className="text-center text-[10px] text-muted-foreground/30 tabular-nums pt-1">
          v{process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0'}
        </p>
      </div>
    </aside>
  );
}

function ViewSwitchBottomButton({ activeView }: { activeView: 'organizer' | 'player' }) {
  const [open, setOpen] = useState(false);
  const next = activeView === 'organizer' ? 'player' : 'organizer';
  const label = activeView === 'organizer' ? 'Player' : 'Org';

  function handleConfirm() {
    setOpen(false);
    const oneYear = 60 * 60 * 24 * 365;
    const secure = window.location.protocol === 'https:' ? '; secure' : '';
    document.cookie = `view-mode=${next}; path=/; max-age=${oneYear}; samesite=lax${secure}`;
    window.location.href = '/dashboard';
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftRight className="h-5 w-5" />
        <span>{label}</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Switch to {next === 'organizer' ? 'Organizer' : 'Player'} View?</DialogTitle>
            <DialogDescription>
              {next === 'player'
                ? 'You will see your player profile and stats.'
                : 'You will see your organizer dashboard, matches, teams, and tournaments.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={handleConfirm}
              className={next === 'organizer' ? 'bg-cricket-green hover:bg-cricket-green/90' : 'bg-blue-600 hover:bg-blue-700'}
            >
              {`Switch to ${next === 'organizer' ? 'Organizer' : 'Player'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function BottomNav({ activeView, playerId, playerIncomplete }: NavProps) {
  const pathname = usePathname();
  const navItems = getNavItems(activeView, playerId, playerIncomplete);
  const items = navItems.slice(0, 4);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-strong md:hidden">
      <div className="flex h-16 items-stretch">
        {items.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          const isLocked = playerIncomplete && !href.endsWith('/edit');
          if (isLocked) {
            return (
              <span
                key={href}
                title="Complete your player profile first"
                className="relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground/25 cursor-not-allowed select-none"
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </span>
            );
          }
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
        {!playerIncomplete && (
          <ViewSwitchBottomButton activeView={activeView} />
        )}
      </div>
    </nav>
  );
}
