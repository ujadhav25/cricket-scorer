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
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-2 text-4xl">🏏</div>
          <CardTitle className="text-2xl">Sign in to CricScorer</CardTitle>
          <CardDescription>Use Google or your email to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {emailSent ? (
            <div className="rounded-lg bg-cricket-green/10 border border-cricket-green/30 p-4 text-center">
              <p className="font-medium text-cricket-green">Check your email!</p>
              <p className="mt-1 text-sm text-muted-foreground">We sent a magic link to your inbox.</p>
            </div>
          ) : (
            <>
              <Button
                className="w-full bg-white text-gray-800 hover:bg-gray-100 border border-gray-300"
                size="lg"
                onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <div>
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="mt-1"
                    {...register('email')}
                  />
                  {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <Button type="submit" className="w-full bg-cricket-green hover:bg-cricket-green/90" size="lg" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Magic Link'}
                </Button>
              </form>
            </>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-cricket-green hover:underline">Sign up</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
