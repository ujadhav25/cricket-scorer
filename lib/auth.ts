import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/lib/auth.config';
import { logger } from '@/lib/logger';

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
          logger.error('[auth] Failed to auto-create player', e, { userId: user.id });
        }
      }
    },
  },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // Fetch role from DB on first sign-in so it's in the JWT.
        // Use raw query to avoid Prisma enum validation crashing if the DB
        // enum hasn't been migrated yet (e.g. SUPER_ADMIN not added).
        try {
          const rows = await prisma.$queryRaw<{ role: string }[]>`
            SELECT role::text FROM "User" WHERE id = ${user.id as string} LIMIT 1
          `;
          token.role = rows[0]?.role ?? 'ORGANIZER';
        } catch {
          token.role = 'ORGANIZER';
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
  },
});
