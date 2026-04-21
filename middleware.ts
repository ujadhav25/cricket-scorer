import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/players/:path*',
    '/teams/:path*',
    '/matches/:path*',
    '/tournaments/:path*',
    '/history/:path*',
    '/settings/:path*',
  ],
};
