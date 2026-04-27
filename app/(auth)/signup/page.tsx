import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default async function SignupPage() {
  const session = await auth();
  if (session) redirect('/dashboard');

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-b from-cricket-green-500/10 to-transparent rounded-full blur-3xl" />
      </div>
      <div className="relative w-full max-w-md text-center animate-fade-in">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cricket-green-500 to-cricket-green-600 text-3xl shadow-lg shadow-cricket-green-500/20">🏏</div>
        <h1 className="mb-3 text-3xl font-black tracking-tight">Create your account</h1>
        <p className="mb-8 text-muted-foreground">Sign up is done through the login page — just use Google or your email.</p>
        <Button asChild size="xl">
          <Link href="/login" className="gap-2">
            Go to Login <ArrowRight className="h-5 w-5" />
          </Link>
        </Button>
      </div>
    </main>
  );
}
