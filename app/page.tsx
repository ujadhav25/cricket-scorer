import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Activity, Trophy, BarChart3, Zap, ArrowRight, Users, Globe } from 'lucide-react';

export default async function HomePage() {
  const session = await auth();
  if (session) redirect('/dashboard');

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-cricket-green-500/10 via-cricket-green-500/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-to-t from-cricket-amber-500/8 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/4 left-0 w-[300px] h-[300px] bg-gradient-to-r from-blue-500/5 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Hero */}
      <div className="relative flex flex-col items-center justify-center min-h-screen px-4 pt-10 pb-20">
        <div className="text-center max-w-3xl mx-auto">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border/40 bg-card/50 backdrop-blur-sm px-4 py-2 text-sm text-muted-foreground">
            <Zap className="h-4 w-4 text-cricket-amber" />
            <span>Real-time cricket scoring platform</span>
          </div>

          <h1 className="mb-6 text-5xl sm:text-7xl font-black tracking-tight">
            Score Cricket
            <br />
            <span className="text-gradient">Like a Pro</span>
          </h1>

          <p className="mb-10 text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Ball-by-ball live scoring, tournament management, and detailed career statistics — everything you need in one beautiful app.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row justify-center">
            <Button asChild size="xl">
              <Link href="/login" className="gap-2">
                Get Started <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="glass">
              <Link href="/signup">Create Free Account</Link>
            </Button>
          </div>
        </div>

        {/* Feature cards */}
        <div className="mt-24 grid grid-cols-1 gap-4 sm:grid-cols-3 max-w-4xl w-full px-4">
          {[
            { icon: Activity, title: 'Live Scoring', desc: 'Ball-by-ball with WebSocket real-time updates for spectators', color: 'from-cricket-green-500/20 to-cricket-green-500/5', iconColor: 'text-cricket-green' },
            { icon: Trophy, title: 'Tournaments', desc: 'League, Knockout & Group stages with auto-generated fixtures', color: 'from-cricket-amber-500/20 to-cricket-amber-500/5', iconColor: 'text-cricket-amber' },
            { icon: BarChart3, title: 'Career Stats', desc: 'Detailed batting & bowling analytics across all matches', color: 'from-blue-500/20 to-blue-500/5', iconColor: 'text-blue-400' },
          ].map(({ icon: Icon, title, desc, color, iconColor }) => (
            <div key={title} className="group relative rounded-2xl border border-border/30 bg-card/40 backdrop-blur-sm p-6 transition-all duration-300 hover:border-border/60 hover:bg-card/60 hover:-translate-y-1">
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className="relative">
                <div className={`mb-4 inline-flex rounded-xl bg-white/[0.05] p-3 ${iconColor}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-base font-bold">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Stats strip */}
        <div className="mt-20 flex flex-wrap items-center justify-center gap-8 sm:gap-16 text-center">
          {[
            { icon: Users, value: 'Free', label: 'Forever' },
            { icon: Globe, value: 'Live', label: 'Share Links' },
            { icon: Zap, value: 'Instant', label: 'Updates' },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <Icon className="h-5 w-5 text-muted-foreground/60 mb-1" />
              <p className="text-2xl font-black text-gradient">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
