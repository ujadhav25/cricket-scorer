import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function SignupPage() {
  const session = await auth();
  if (session) redirect('/dashboard');

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-4 text-5xl">🏏</div>
        <h1 className="mb-2 text-2xl font-bold">Create your account</h1>
        <p className="mb-6 text-muted-foreground">Sign up is done through the login page — just use Google or your email.</p>
        <Link
          href="/login"
          className="inline-block rounded-lg bg-cricket-green px-6 py-3 font-semibold text-white hover:bg-cricket-green/90"
        >
          Go to Login
        </Link>
      </div>
    </main>
  );
}
