import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const { auth } = NextAuth(authConfig);

export default auth((req: NextRequest & { auth: unknown }) => {
  // Cast pages are public — no auth required
  if (req.nextUrl.pathname.endsWith('/cast')) {
    return NextResponse.next();
  }
  // All other matched routes require auth
  if (!(req as any).auth) {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
});

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
