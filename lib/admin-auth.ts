import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';

export const {
  handlers: adminHandlers,
  auth: adminAuth,
  signIn: adminSignIn,
  signOut: adminSignOut,
} = NextAuth({
  basePath: '/api/admin/auth',
  cookies: {
    sessionToken: {
      name: 'admin-session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  session: { strategy: 'jwt' as const },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      try {
        const admin = await prisma.admin.findUnique({ where: { email: user.email.toLowerCase() } });
        if (!admin) {
          console.error('[AdminAuth] signIn denied — email not in Admin table:', user.email);
          return '/admin/login?error=AccessDenied';
        }
        // Update name/image and last active on every sign-in
        await prisma.admin.update({
          where: { email: admin.email },
          data: {
            lastActiveAt: new Date(),
            name: user.name ?? admin.name,
            image: user.image ?? admin.image,
          },
        });
        return true;
      } catch (err) {
        console.error('[AdminAuth] signIn error:', err);
        return '/admin/login?error=AccessDenied';
      }
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const admin = await prisma.admin.findUnique({ where: { email: user.email } });
        if (admin) {
          token.adminId = admin.id;
          token.adminEmail = admin.email;
          token.adminName = admin.name;
          token.adminImage = admin.image;
          token.adminDept = admin.department;
        }
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).admin = {
        id: token.adminId,
        email: token.adminEmail,
        name: token.adminName,
        image: token.adminImage,
        department: token.adminDept,
      };
      return session;
    },
  },
});

export type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  department: string | null;
};
