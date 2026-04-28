import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  Activity, Trophy, BarChart3, Zap, Users, Globe,
  Bell, Share2, Smartphone, TrendingUp, Award,
  Download, Code2, Radio, CheckCircle2, Link2,
  Shield, Target,
} from 'lucide-react';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { LandingDotNav } from '@/components/LandingDotNav';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ScrollReveal } from '@/components/ScrollReveal';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CricScorer — Real-time Cricket Scoring App',
  description:
    'Ball-by-ball live scoring, 4 tournament formats, career analytics, push notifications, public scorecards & PWA. Free cricket platform.',
  openGraph: {
    title: 'CricScorer — Real-time Cricket Scoring App',
    description:
      'Ball-by-ball live scoring, 4 tournament formats, career analytics, push notifications and more. Completely free.',
    type: 'website',
  },
};

export default async function HomePage() {
  const session = await auth();
  if (session) redirect('/dashboard');

  return (
    <main className="relative overflow-x-hidden bg-background text-foreground">
      <LandingDotNav />
      {/* Theme toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[700px] w-[700px] rounded-full bg-cricket-green-500/8 blur-3xl" />
        <div className="absolute top-1/2 -right-40 h-[500px] w-[500px] rounded-full bg-cricket-amber-500/6 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-blue-500/5 blur-3xl" />
      </div>

      {/* ── HERO ── */}
      <section id="hero" className="relative flex min-h-screen flex-col items-center justify-center px-4 pb-24 pt-16 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cricket-green-500/30 bg-cricket-green-500/10 px-4 py-1.5 text-sm text-cricket-green-400">
          <Zap className="h-3.5 w-3.5" />
          <span>Push Notifications · PWA · Live Cast · Embed Widget</span>
        </div>

        <h1 className="mb-6 max-w-3xl text-5xl font-black tracking-tight sm:text-7xl">
          Score Cricket
          <br />
          <span className="text-gradient">Like a Pro</span>
        </h1>

        <p className="mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed">
          Ball-by-ball scoring, tournament management, career analytics, live spectator pages, push notifications — completely free.
        </p>

        <GoogleSignInButton />

        <p className="mt-4 text-sm text-muted-foreground/60">
          Free forever &nbsp;·&nbsp; No credit card &nbsp;·&nbsp; Works offline as PWA
        </p>

        {/* Feature pills */}
        <div className="mt-16 flex flex-wrap justify-center gap-3">
          {[
            { icon: Radio, label: 'Live Ball-by-Ball' },
            { icon: Trophy, label: '4 Tournament Formats' },
            { icon: BarChart3, label: 'Career Analytics' },
            { icon: Bell, label: 'Push Notifications' },
            { icon: Share2, label: 'Public Scorecards' },
            { icon: Smartphone, label: 'Install as App' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 rounded-full border border-border/30 bg-card/40 backdrop-blur-sm px-4 py-2 text-sm text-muted-foreground">
              <Icon className="h-3.5 w-3.5 text-cricket-green" />
              {label}
            </div>
          ))}
        </div>

        {/* Scroll nudge */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5">
          <span className="text-xs text-muted-foreground/40 tracking-widest uppercase">scroll</span>
          <div className="flex flex-col items-center gap-0.5">
            <svg
              className="h-5 w-5 text-cricket-green/60 animate-bounce"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            <svg
              className="h-5 w-5 text-cricket-green/30 animate-bounce [animation-delay:150ms]"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </section>

      {/* ── LIVE SCORING ── */}
      <section id="scoring" className="relative flex min-h-screen flex-col justify-center px-4 py-24">
        <ScrollReveal className="w-full">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            {/* Text */}
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cricket-green-500/20 bg-cricket-green-500/10 px-3 py-1 text-xs font-medium text-cricket-green-400">
                <Activity className="h-3.5 w-3.5" />
                Live Scoring
              </div>
              <h2 className="mb-5 text-3xl font-black tracking-tight sm:text-4xl">
                Built for speed.
                <br />
                <span className="text-gradient">Zero friction.</span>
              </h2>
              <p className="mb-6 leading-relaxed text-muted-foreground">
                Enter deliveries in a single tap. Optimized for phone and tablet so you never miss a ball — even in full sun.
              </p>
              <ul className="space-y-3">
                {[
                  '8 dismissal types with fielder & bowler attribution',
                  'Wides, no-balls, byes & leg byes',
                  'Undo last delivery anytime',
                  'Automatic innings & super over transitions',
                  'Man of the Match selection with animations',
                  'Real-time updates for spectators via SSE + Pusher',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cricket-green" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Mock scorecard */}
            <div className="overflow-hidden rounded-2xl border border-border/40 bg-card/60 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-border/30 bg-cricket-green-500/10 px-5 py-3">
                <span className="text-sm font-semibold">Warriors vs Strikers</span>
                <span className="flex items-center gap-1.5 text-xs font-medium text-red-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
                  LIVE
                </span>
              </div>
              <div className="space-y-4 p-5">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="mb-1 text-sm text-muted-foreground">Warriors</div>
                    <div className="text-4xl font-black text-cricket-green">142/4</div>
                    <div className="mt-1 text-xs text-muted-foreground">18.3 / 20 overs</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Need</div>
                    <div className="text-xl font-bold text-cricket-amber">58 off 9</div>
                    <div className="text-xs text-muted-foreground">RRR 9.67</div>
                  </div>
                </div>
                <div className="space-y-1.5 border-t border-border/20 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">★ Rahul Kumar</span>
                    <span className="tabular-nums">64 (41) &nbsp;4×6 6×2</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Amit Singh</span>
                    <span className="tabular-nums">23 (18) &nbsp;4×2</span>
                  </div>
                </div>
                <div className="border-t border-border/20 pt-4">
                  <div className="mb-2 text-xs text-muted-foreground">This over · R. Sharma bowling</div>
                  <div className="flex gap-1.5">
                    {[
                      { b: '1', s: '' }, { b: '4', s: 'b' }, { b: 'W', s: 'w' },
                      { b: '0', s: '' }, { b: '6', s: 's' }, { b: '·', s: 'd' },
                    ].map(({ b, s }, i) => (
                      <div key={i} className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold
                        ${s === 'w' ? 'border-red-500/40 bg-red-500/15 text-red-400' :
                          s === 'b' ? 'border-blue-500/40 bg-blue-500/15 text-blue-300' :
                          s === 's' ? 'border-cricket-green-500/40 bg-cricket-green-500/15 text-cricket-green' :
                          s === 'd' ? 'border-border/30 bg-white/[0.02] text-muted-foreground/40' :
                          'border-border/30 bg-white/5 text-foreground'}`}>
                        {b}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t border-border/20 pt-3 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/80">Bowling:</span>&nbsp; V. Patel &nbsp;·&nbsp; 3.3–0–28–2
                </div>
              </div>
            </div>
          </div>
        </div>
        </ScrollReveal>
      </section>

      {/* ── TOURNAMENT FORMATS ── */}
      <section id="tournaments" className="relative flex min-h-screen flex-col justify-center px-4 py-24">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-cricket-amber-500/[0.04] to-transparent" />
        <ScrollReveal className="w-full">
        <div className="relative mx-auto max-w-6xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cricket-amber-500/20 bg-cricket-amber-500/10 px-3 py-1 text-xs font-medium text-cricket-amber">
            <Trophy className="h-3.5 w-3.5" />
            Tournament Manager
          </div>
          <h2 className="mb-4 text-3xl font-black tracking-tight sm:text-4xl">
            Run any format of tournament
          </h2>
          <p className="mx-auto mb-12 max-w-xl text-muted-foreground">
            From a quick bilateral series to a full group-stage knockout, CricScorer auto-generates fixtures, tracks NRR, and builds the points table.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: '⚡', title: 'Bilateral', desc: 'Fixed series between two teams — home & away', border: 'border-blue-500/20 hover:border-blue-500/40', grad: 'from-blue-500/15 to-blue-500/5' },
              { icon: '📊', title: 'League', desc: 'Round-robin with full points table & NRR rankings', border: 'border-cricket-green-500/20 hover:border-cricket-green-500/40', grad: 'from-cricket-green-500/15 to-cricket-green-500/5' },
              { icon: '🏟️', title: 'Group Stage', desc: 'Teams split into groups, top teams advance', border: 'border-purple-500/20 hover:border-purple-500/40', grad: 'from-purple-500/15 to-purple-500/5' },
              { icon: '🏆', title: 'Knockout', desc: 'Bracket-style elimination — winner takes all', border: 'border-cricket-amber-500/20 hover:border-cricket-amber-500/40', grad: 'from-cricket-amber-500/15 to-cricket-amber-500/5' },
            ].map(({ icon, title, desc, border, grad }) => (
              <div key={title} className={`group rounded-2xl border bg-gradient-to-br ${grad} ${border} p-6 text-left transition-all duration-300 hover:-translate-y-1`}>
                <div className="mb-4 text-3xl">{icon}</div>
                <h3 className="mb-2 text-base font-bold">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-5 text-sm text-muted-foreground">
            {['Auto-generated fixtures', 'Points table & NRR', 'Tournament share links', 'Top scorers & wicket-takers'].map(f => (
              <span key={f} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-cricket-amber" />
                {f}
              </span>
            ))}
          </div>
        </div>
        </ScrollReveal>
      </section>

      {/* ── ANALYTICS ── */}
      <section id="analytics" className="relative flex min-h-screen flex-col justify-center px-4 py-24">
        <ScrollReveal className="w-full">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            {/* Mock analytics card */}
            <div className="overflow-hidden rounded-2xl border border-border/40 bg-card/60 p-6 shadow-2xl backdrop-blur-sm">
              <div className="mb-1 text-sm font-semibold">Rahul Kumar — Career Batting</div>
              <div className="mb-4 text-xs text-muted-foreground">Last 10 innings</div>
              <div className="flex h-28 items-end gap-1.5">
                {[45, 72, 31, 89, 12, 94, 67, 78, 42, 88].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t-sm bg-cricket-green-500/40 transition-colors hover:bg-cricket-green-500/70" style={{ height: `${h}%` }} />
                ))}
              </div>
              <div className="mt-1 flex justify-between text-xs text-muted-foreground/50">
                <span>M1</span><span>M5</span><span>M10</span>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border/20 pt-5">
                {[
                  { v: '68.4', l: 'Average', c: 'text-cricket-green' },
                  { v: '142.3', l: 'Strike Rate', c: 'text-cricket-amber' },
                  { v: '3', l: 'Fifties', c: 'text-blue-400' },
                ].map(({ v, l, c }) => (
                  <div key={l} className="text-center">
                    <div className={`text-xl font-black ${c}`}>{v}</div>
                    <div className="text-xs text-muted-foreground">{l}</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 border-t border-border/20 pt-4">
                <div className="mb-3 text-xs font-medium text-muted-foreground">Bowling</div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { v: '24', l: 'Wickets', c: 'text-red-400' },
                    { v: '6.8', l: 'Economy', c: 'text-purple-400' },
                    { v: '4/18', l: 'Best', c: 'text-cricket-amber' },
                  ].map(({ v, l, c }) => (
                    <div key={l} className="text-center">
                      <div className={`text-xl font-black ${c}`}>{v}</div>
                      <div className="text-xs text-muted-foreground">{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Text */}
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
                <BarChart3 className="h-3.5 w-3.5" />
                Career Analytics
              </div>
              <h2 className="mb-5 text-3xl font-black tracking-tight sm:text-4xl">
                Every stat, every match,
                <br />
                <span className="text-gradient">beautifully visualized</span>
              </h2>
              <p className="mb-6 leading-relaxed text-muted-foreground">
                Players get a full career dashboard with batting & bowling breakdowns across every match and tournament they've played.
              </p>
              <ul className="space-y-3">
                {[
                  'Batting averages, strike rates, fifties & hundreds',
                  'Bowling economy, maidens & best figures',
                  'Visual charts: runs per innings, worm graph, Manhattan',
                  'Partnership tracking with run contributions',
                  'Dismissal breakdown by type',
                  'Tournament-wide and career-wide aggregation',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        </ScrollReveal>
      </section>

      {/* ── SHARE & SPECTATE ── */}
      <section id="share" className="relative flex min-h-screen flex-col justify-center px-4 py-24">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/[0.04] to-transparent" />
        <ScrollReveal className="w-full">
        <div className="relative mx-auto max-w-6xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
            <Share2 className="h-3.5 w-3.5" />
            Share & Spectate
          </div>
          <h2 className="mb-4 text-3xl font-black tracking-tight sm:text-4xl">
            Your fans watch live,{' '}
            <span className="text-gradient">for free</span>
          </h2>
          <p className="mx-auto mb-12 max-w-xl text-muted-foreground">
            One tap generates a shareable link. Spectators see the live scorecard update in real time — no login needed.
          </p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[
              {
                icon: Globe,
                iconColor: 'text-cricket-green',
                bg: 'from-cricket-green-500/15 to-cricket-green-500/5',
                border: 'border-cricket-green-500/20',
                title: 'Public Live Scorecards',
                desc: 'Share a link — anyone can follow the match live with ball-by-ball updates, no account needed.',
                tag: 'cricscorer.app/m/abc123',
              },
              {
                icon: Code2,
                iconColor: 'text-purple-400',
                bg: 'from-purple-500/15 to-purple-500/5',
                border: 'border-purple-500/20',
                title: 'Embed on Any Website',
                desc: 'Drop a compact widget into your club website or blog — it shows the live score automatically.',
                tag: '<iframe src="…/embed/abc123">',
              },
              {
                icon: Bell,
                iconColor: 'text-cricket-amber',
                bg: 'from-cricket-amber-500/15 to-cricket-amber-500/5',
                border: 'border-cricket-amber-500/20',
                title: 'Push Notifications',
                desc: 'Subscribe to a match and get instant browser push alerts when it goes live or a wicket falls.',
                tag: '🔔 Warriors vs Strikers is LIVE',
              },
            ].map(({ icon: Icon, iconColor, bg, border, title, desc, tag }) => (
              <div key={title} className={`rounded-2xl border ${border} bg-gradient-to-br ${bg} p-6 text-left`}>
                <div className={`mb-4 inline-flex rounded-xl bg-white/5 p-3 ${iconColor}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-bold">{title}</h3>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{desc}</p>
                <div className="rounded-lg border border-border/30 bg-black/20 px-3 py-2 font-mono text-xs text-muted-foreground/70">
                  {tag}
                </div>
              </div>
            ))}
          </div>
        </div>
        </ScrollReveal>
      </section>

      {/* ── TEAMS & PLAYERS ── */}
      <section id="teams" className="relative flex min-h-screen flex-col justify-center px-4 py-24">
        <ScrollReveal className="w-full">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            {/* Text */}
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cricket-amber-500/20 bg-cricket-amber-500/10 px-3 py-1 text-xs font-medium text-cricket-amber">
                <Users className="h-3.5 w-3.5" />
                Teams & Players
              </div>
              <h2 className="mb-5 text-3xl font-black tracking-tight sm:text-4xl">
                Manage your entire
                <br />
                <span className="text-gradient">cricket ecosystem</span>
              </h2>
              <p className="mb-6 leading-relaxed text-muted-foreground">
                From squad management to player discovery, everything is tracked so you can focus on the game.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  { icon: Shield, label: 'Custom team colors & avatars' },
                  { icon: Users, label: 'Squad management & captains' },
                  { icon: Link2, label: 'Shareable team invite links' },
                  { icon: Target, label: 'Batting & bowling style filters' },
                  { icon: Award, label: 'Man of the Match tracking' },
                  { icon: TrendingUp, label: 'Player profile claim system' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cricket-amber-500/10">
                      <Icon className="h-3.5 w-3.5 text-cricket-amber" />
                    </div>
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Mock team list */}
            <div className="space-y-3">
              {[
                { name: 'Royal Warriors', record: '12W 3L 1T', color: 'bg-blue-500', players: 15, captain: 'Rahul K.' },
                { name: 'Thunder Strikers', record: '9W 5L 2T', color: 'bg-red-500', players: 13, captain: 'Amit S.' },
                { name: 'Green Giants', record: '7W 8L 0T', color: 'bg-cricket-green-500', players: 14, captain: 'Vijay R.' },
              ].map(({ name, record, color, players, captain }) => (
                <div key={name} className="flex items-center gap-4 rounded-2xl border border-border/30 bg-card/40 px-5 py-4 backdrop-blur-sm transition-all hover:border-border/60 hover:bg-card/60">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color} text-sm font-black text-white`}>
                    {name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{name}</div>
                    <div className="text-xs text-muted-foreground">Captain: {captain} · {players} players</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-xs font-medium text-cricket-green">{record.split(' ')[0]}</div>
                    <div className="text-xs text-muted-foreground">{record.split(' ').slice(1).join(' ')}</div>
                  </div>
                </div>
              ))}
              <div className="rounded-2xl border border-dashed border-border/30 px-5 py-4 text-center text-sm text-muted-foreground/40">
                + Add another team
              </div>
            </div>
          </div>
        </div>
        </ScrollReveal>
      </section>

      {/* ── PWA ── */}
      <section id="pwa" className="relative flex min-h-screen flex-col justify-center px-4 py-16">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-cricket-green-500/[0.04] to-transparent" />
        <ScrollReveal className="w-full">
        <div className="relative mx-auto max-w-6xl">

          {/* Header */}
          <div className="mb-10 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cricket-green-500/20 bg-cricket-green-500/10 px-3 py-1 text-xs font-medium text-cricket-green-400">
              <Smartphone className="h-3.5 w-3.5" />
              Progressive Web App
            </div>
            <h2 className="mb-3 text-3xl font-black tracking-tight sm:text-4xl">
              Take CricScorer <span className="text-gradient">everywhere</span>
            </h2>
            <p className="mx-auto max-w-lg text-sm text-muted-foreground">
              Install from your browser — no app store required. Works offline, feels native.
            </p>
          </div>

          {/* 3-col grid */}
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_auto_1fr]">

            {/* Left — install steps */}
            <div className="space-y-4">
              {/* Android */}
              <div className="rounded-2xl border border-border/40 bg-card/50 p-4 backdrop-blur-sm">
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-green-500/15 text-base">🤖</div>
                  <div>
                    <div className="text-sm font-bold">Android</div>
                    <div className="text-[11px] text-muted-foreground">Chrome · Edge · Samsung</div>
                  </div>
                </div>
                <ol className="space-y-2">
                  {[
                    'Open CricScorer in Chrome',
                    'Tap ⋮ menu → "Add to Home Screen"',
                    'Tap "Install" — done!',
                  ].map((text, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-xs text-muted-foreground">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cricket-green-500/15 text-[10px] font-bold text-cricket-green">{i + 1}</span>
                      {text}
                    </li>
                  ))}
                </ol>
              </div>

              {/* iOS */}
              <div className="rounded-2xl border border-border/40 bg-card/50 p-4 backdrop-blur-sm">
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-500/15 text-base">🍎</div>
                  <div>
                    <div className="text-sm font-bold">iPhone / iPad</div>
                    <div className="text-[11px] text-muted-foreground">Safari required</div>
                  </div>
                </div>
                <ol className="space-y-2">
                  {[
                    'Open CricScorer in Safari',
                    'Tap Share ⎙ → "Add to Home Screen"',
                    'Tap "Add" — done!',
                  ].map((text, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-xs text-muted-foreground">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cricket-green-500/15 text-[10px] font-bold text-cricket-green">{i + 1}</span>
                      {text}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Feature chips */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: Zap, label: 'Works offline' },
                  { icon: Bell, label: 'Push alerts' },
                  { icon: Download, label: 'No app store' },
                  { icon: Shield, label: 'Auto-updates' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 rounded-xl border border-cricket-green-500/15 bg-cricket-green-500/8 px-3 py-2">
                    <Icon className="h-3.5 w-3.5 shrink-0 text-cricket-green" />
                    <span className="text-xs font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Center — iPhone mockup */}
            <div className="flex justify-center">
              <div className="relative">
                {/* Glow */}
                <div className="pointer-events-none absolute inset-4 rounded-[3rem] bg-cricket-green-500/25 blur-2xl" />
                {/* iPhone shell */}
                <div className="relative w-[200px] overflow-hidden rounded-[3rem] border-[5px] border-border/70 bg-[hsl(225,25%,7%)] shadow-2xl">
                  {/* Side buttons */}
                  <div className="absolute -left-[7px] top-20 h-8 w-[5px] rounded-l-full bg-border/60" />
                  <div className="absolute -left-[7px] top-32 h-8 w-[5px] rounded-l-full bg-border/60" />
                  <div className="absolute -right-[7px] top-24 h-12 w-[5px] rounded-r-full bg-border/60" />

                  {/* Status bar + Dynamic Island */}
                  <div className="relative flex items-center justify-between bg-black/40 px-4 pb-1 pt-2 text-[9px] text-white/60">
                    <span className="font-medium">9:41</span>
                    {/* Dynamic Island */}
                    <div className="absolute left-1/2 top-1 -translate-x-1/2 h-[14px] w-[68px] rounded-full bg-black" />
                    <div className="flex items-center gap-1 text-white/70">
                      <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 fill-current"><path d="M1.5 8.5a13 13 0 0 1 21 0M5 12a9 9 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0M12 19h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>
                      <svg viewBox="0 0 24 24" className="h-2.5 w-3 fill-current"><rect x="2" y="7" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M20 11v2a1 1 0 0 0 0-2z" fill="currentColor"/></svg>
                    </div>
                  </div>

                  {/* Screen content */}
                  <div className="bg-gradient-to-b from-[hsl(225,25%,9%)] to-[hsl(225,25%,6%)] px-3 pb-3 pt-2">
                    {/* App grid */}
                    <div className="mb-2 grid grid-cols-4 gap-2">
                      {[
                        { e: '📸', n: 'Camera' }, { e: '🎵', n: 'Music' },
                        { e: '🗺️', n: 'Maps' }, { e: '📧', n: 'Mail' },
                        { e: '📅', n: 'Cal' }, { e: '⚙️', n: 'Settings' },
                        { e: '🌤️', n: 'Weather' },
                      ].map(({ e, n }) => (
                        <div key={n} className="flex flex-col items-center gap-0.5">
                          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-white/10 text-base">{e}</div>
                          <span className="text-[7px] text-white/40 truncate w-full text-center">{n}</span>
                        </div>
                      ))}
                      {/* CricScorer — highlighted */}
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="relative flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-cricket-green-500 to-cricket-green-700 text-base shadow-lg shadow-cricket-green-500/50">
                          🏏
                          <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3 items-center justify-center rounded-full border border-black bg-red-500 text-[7px] font-bold text-white">2</span>
                        </div>
                        <span className="text-[7px] font-medium text-white/80">CricScorer</span>
                      </div>
                    </div>

                    {/* Lock screen notification */}
                    <div className="mb-2 rounded-xl bg-white/[0.08] p-2 backdrop-blur-sm">
                      <div className="mb-1 flex items-center gap-1.5">
                        <div className="flex h-4 w-4 items-center justify-center rounded-[4px] bg-gradient-to-br from-cricket-green-500 to-cricket-green-700 text-[8px]">🏏</div>
                        <span className="text-[9px] font-semibold text-white/90">CricScorer</span>
                        <span className="ml-auto text-[8px] text-white/40">now</span>
                      </div>
                      <p className="text-[8px] leading-snug text-white/60">⚡ Warriors vs Strikers is LIVE — tap to watch ball-by-ball</p>
                    </div>

                    {/* Mini scorecard */}
                    <div className="rounded-xl border border-cricket-green-500/20 bg-cricket-green-500/10 p-2">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[9px] font-bold text-cricket-green">LIVE · 142/4</span>
                        <span className="flex items-center gap-0.5 text-[8px] text-red-400">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
                          18.3 ov
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {[{ b: '1', t: '' }, { b: '4', t: 'b' }, { b: 'W', t: 'w' }, { b: '0', t: '' }, { b: '6', t: 's' }, { b: '·', t: 'd' }].map(({ b, t }, i) => (
                          <div key={i} className={`flex h-5 w-5 items-center justify-center rounded-full border text-[8px] font-bold
                            ${t === 'w' ? 'border-red-500/50 bg-red-500/20 text-red-400' :
                              t === 'b' || t === 's' ? 'border-cricket-green-500/50 bg-cricket-green-500/20 text-cricket-green' :
                              t === 'd' ? 'border-white/10 bg-white/5 text-white/20' :
                              'border-white/20 bg-white/5 text-white/70'}`}>{b}</div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Home indicator */}
                  <div className="flex justify-center bg-black/20 py-1.5">
                    <div className="h-1 w-14 rounded-full bg-white/20" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right — why PWA */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/40 bg-card/50 p-4 backdrop-blur-sm">
                <div className="mb-3 text-sm font-bold text-foreground/90">Why install as an app?</div>
                <ul className="space-y-3">
                  {[
                    { icon: Zap, title: 'Instant load', desc: 'Opens in under a second, no browser chrome', color: 'text-cricket-amber' },
                    { icon: Bell, title: 'Live push alerts', desc: 'Get notified for wickets, match start & result', color: 'text-blue-400' },
                    { icon: Smartphone, title: 'Full-screen mode', desc: 'No address bar — feels exactly like a native app', color: 'text-purple-400' },
                    { icon: Download, title: 'Works offline', desc: 'Score matches even with no internet connection', color: 'text-cricket-green' },
                  ].map(({ icon: Icon, title, desc, color }) => (
                    <li key={title} className="flex items-start gap-3">
                      <div className={`mt-0.5 shrink-0 ${color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold">{title}</div>
                        <div className="text-[11px] text-muted-foreground">{desc}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-cricket-green-500/20 bg-cricket-green-500/8 p-4 text-center">
                <div className="mb-1 text-2xl">🚀</div>
                <div className="text-sm font-bold">Zero MB download</div>
                <div className="text-xs text-muted-foreground">No app store. No storage bloat. Just tap and play.</div>
              </div>
            </div>

          </div>
        </div>
        </ScrollReveal>
      </section>

      {/* ── FINAL CTA ── */}
      <section id="cta" className="relative flex min-h-screen flex-col items-center justify-center px-4 py-28 text-center">
        <ScrollReveal className="w-full">
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 text-5xl">🏏</div>
          <h2 className="mb-4 text-3xl font-black tracking-tight sm:text-5xl">
            Ready to score
            <br />
            <span className="text-gradient">better cricket?</span>
          </h2>
          <p className="mb-8 text-muted-foreground">
            Join cricketers already using CricScorer. Free forever, no credit card required.
          </p>
          <GoogleSignInButton />
          <p className="mt-4 text-xs text-muted-foreground/50">
            By signing in you agree to our terms. We&apos;ll never spam you.
          </p>
        </div>
        </ScrollReveal>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border/30 px-4 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} CricScorer &nbsp;·&nbsp; Free cricket scoring platform
        {process.env.NEXT_PUBLIC_APP_VERSION && (
          <span className="ml-3 inline-flex items-center rounded-full border border-border/50 bg-card/60 px-2 py-0.5 font-mono text-[10px] text-muted-foreground/70">
            v{process.env.NEXT_PUBLIC_APP_VERSION}
          </span>
        )}
      </footer>
    </main>
  );
}
