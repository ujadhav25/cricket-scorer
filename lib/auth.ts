import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/lib/auth.config';

const providers = [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
  }),
  ...(process.env.EMAIL_SERVER
    ? [
        EmailProvider({
          server: process.env.EMAIL_SERVER,
          from: process.env.EMAIL_FROM ?? 'noreply@cricket-scorer.app',
        }),
      ]
    : []),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers,
  events: {
    async createUser({ user }) {
      // Auto-create a Player record for every new account and link it
      // Use email prefix as fallback if name is not provided
      if (user.id) {
        const playerName = user.name ?? user.email?.split('@')[0] ?? 'Player';
        try {
          await prisma.player.create({
            data: {
              userId: user.id,
              name: playerName,
            },
          });
        } catch (e) {
          console.error('[createUser] Failed to auto-create player:', e);
        }
      }
    },
  },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
