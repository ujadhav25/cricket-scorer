import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
    verifyRequest: '/verify',
  },
  session: { strategy: 'jwt' as const },
  // AUTH_URL / NEXTAUTH_URL must be set in production env vars.
  // trustHost is needed for Vercel proxy; set AUTH_URL to your canonical domain to prevent host-header injection.
  trustHost: process.env.AUTH_URL ? false : true,
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
