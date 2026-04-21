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
      // Auto-create a Player record for every new account so they can be added to teams
      if (user.id && user.name) {
        await prisma.player.create({
          data: {
            userId: user.id,
            name: user.name,
          },
        });
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
