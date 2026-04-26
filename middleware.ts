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
    // Only set same-origin relative paths as callbackUrl to prevent open redirect
    const pathname = req.nextUrl.pathname;
    if (pathname.startsWith('/') && !pathname.startsWith('//')) {
      loginUrl.searchParams.set('callbackUrl', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }
  // Inject current pathname into REQUEST headers so server components can read it
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', req.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path+',
    '/players/:path+',
    '/teams/:path+',
    '/matches/:path+',
    '/tournaments/:path+',
    '/history',
    '/history/:path+',
    '/settings',
    '/settings/:path+',
  ],
};
