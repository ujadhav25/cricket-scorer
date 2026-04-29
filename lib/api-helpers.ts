import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';

export async function getAuthSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return { session: null, userId: null };
  }
  return { session, userId: session.user.id };
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function notFoundResponse(entity = 'Resource') {
  return NextResponse.json({ error: `${entity} not found` }, { status: 404 });
}

export function badRequestResponse(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function serverErrorResponse(error: unknown, context?: Record<string, unknown>) {
  logger.error('API server error', error, context);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export function rateLimitResponse(retryAfter = 60) {
  return NextResponse.json(
    { error: 'Too many requests. Please slow down.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': '0',
      },
    }
  );
}

// Reusable Prisma OR filter: returns teams owned by, captained by, or where user is a player
export function teamMemberFilter(userId: string) {
  return {
    OR: [
      { userId },
      { captainUserId: userId },
      { players: { some: { player: { userId } } } },
    ],
  };
}

// Match OR filter: user owns it, or is a player on either team
export function matchMemberFilter(userId: string) {
  return {
    OR: [
      { userId },
      { teamA: { players: { some: { player: { userId } } } } },
      { teamB: { players: { some: { player: { userId } } } } },
    ],
  };
}

// Tournament OR filter: user owns it, or is a player on a registered team
export function tournamentMemberFilter(userId: string) {
  return {
    OR: [
      { userId },
      { teams: { some: { team: { players: { some: { player: { userId } } } } } } },
    ],
  };
}
