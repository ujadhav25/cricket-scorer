import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
    verifyRequest: '/verify',
  },
  session: { strategy: 'jwt' as const },
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
