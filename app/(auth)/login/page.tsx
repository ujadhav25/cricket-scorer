'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit({ email }: FormData) {
    setLoading(true);
    await signIn('email', { email, callbackUrl: '/dashboard', redirect: false });
    setEmailSent(true);
    setLoading(false);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background px-4">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-b from-cricket-green-500/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        <Card className="glass-strong border-border/30 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cricket-green-500 to-cricket-green-600 text-2xl shadow-lg shadow-cricket-green-500/20">🏏</div>
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription>Sign in to continue to CricScorer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {emailSent ? (
              <div className="rounded-2xl bg-cricket-green-500/10 border border-cricket-green-500/20 p-5 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-cricket-green-500/20">
                  <svg className="h-5 w-5 text-cricket-green" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <p className="font-semibold text-cricket-green">Check your email!</p>
                <p className="mt-1 text-sm text-muted-foreground">We sent a magic link to your inbox.</p>
              </div>
            ) : (
              <>
                <Button
                  className="w-full bg-white text-gray-800 hover:bg-gray-50 border border-white/20 shadow-lg rounded-xl h-12 font-semibold transition-all duration-200 hover:scale-[1.01]"
                  size="lg"
                  onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                >
                  <svg className="mr-2.5 h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/30" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-transparent backdrop-blur-sm px-3 text-muted-foreground/60">or</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                  <div>
                    <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="mt-1.5"
                      {...register('email')}
                    />
                    {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
                  </div>
                  <Button type="submit" className="w-full h-12" size="lg" disabled={loading}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        Sending...
                      </span>
                    ) : 'Send Magic Link'}
                  </Button>
                </form>
              </>
            )}

            <p className="text-center text-sm text-muted-foreground pt-2">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-cricket-green font-medium hover:underline">Sign up</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
