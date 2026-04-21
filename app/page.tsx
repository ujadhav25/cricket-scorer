import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function HomePage() {
  const session = await auth();
  if (session) redirect('/dashboard');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="text-center">
        <div className="mb-6 text-8xl">🏏</div>
        <h1 className="mb-3 text-5xl font-black text-foreground">
          Cricket<span className="text-cricket-green">Scorer</span>
        </h1>
        <p className="mb-8 text-lg text-muted-foreground max-w-md mx-auto">
          Real-time cricket scoring, tournament management, and career statistics — all in one app.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row justify-center">
          <Button asChild size="xl" className="bg-cricket-green hover:bg-cricket-green/90">
            <Link href="/login">Get Started</Link>
          </Button>
          <Button asChild size="xl" variant="outline">
            <Link href="/signup">Create Account</Link>
          </Button>
        </div>
      </div>

      <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-3 max-w-3xl w-full">
        {[
          { icon: '⚡', title: 'Live Scoring', desc: 'Ball-by-ball scoring with real-time WebSocket updates' },
          { icon: '🏆', title: 'Tournaments', desc: 'League, Knockout and Group+Knockout formats' },
          { icon: '📊', title: 'Career Stats', desc: 'Detailed player and team statistics across all matches' },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="rounded-xl border border-border bg-card p-6 text-center">
            <div className="mb-3 text-4xl">{icon}</div>
            <h3 className="mb-1 font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
