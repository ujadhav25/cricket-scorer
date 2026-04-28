import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { limiters } from '@/lib/rate-limit';

const { auth } = NextAuth(authConfig);

/** Extract best-effort client IP from request headers */
function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

function tooManyRequests(retryAfter: number) {
  return new NextResponse(
    JSON.stringify({ error: 'Too many requests' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': '0',
      },
    }
  );
}

export default auth((req: NextRequest & { auth: unknown }) => {
  const { pathname } = req.nextUrl;
  const ip = getIp(req);

  // ── Rate limiting for API routes ──────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    let result;

    if (pathname.startsWith('/api/auth/')) {
      result = limiters.auth(ip);
    } else if (pathname.startsWith('/api/join/')) {
      result = limiters.join(ip);
    } else if (pathname.startsWith('/api/matches/') && pathname.endsWith('/ball')) {
      // Ball-by-ball scoring endpoint — highest allowed throughput
      result = limiters.scoring(ip);
    } else {
      result = limiters.api(ip);
    }

    if (!result.success) {
      return tooManyRequests(result.retryAfter ?? 60);
    }
  }

  // Admin routes — SUPER_ADMIN only
  if (pathname.startsWith('/admin')) {
    const user = (req as any).auth?.user;
    if (!user || (user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.nextUrl.origin));
    }
  }

  // Cast pages are public — no auth required
  if (pathname.endsWith('/cast')) {
    return NextResponse.next();
  }

  // All other matched routes require auth
  if (!(req as any).auth) {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    // Only set same-origin relative paths as callbackUrl to prevent open redirect
    if (pathname.startsWith('/') && !pathname.startsWith('//')) {
      loginUrl.searchParams.set('callbackUrl', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Inject current pathname into REQUEST headers so server components can read it
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  matcher: [
    '/api/:path+',
    '/admin',
    '/admin/:path+',
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
