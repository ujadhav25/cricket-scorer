import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession, unauthorizedResponse, badRequestResponse, matchMemberFilter } from '@/lib/api-helpers';
import { z } from 'zod';

const SubscribeSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
  matchId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const { userId } = await getAuthSession();
  if (!userId) return unauthorizedResponse();

  const body = await req.json();
  const result = SubscribeSchema.safeParse(body);
  if (!result.success) return badRequestResponse('Invalid subscription data');

  const { endpoint, p256dh, auth, matchId } = result.data;

  // Validate matchId: must exist and be accessible by this user
  if (matchId) {
    const match = await prisma.match.findFirst({
      where: { id: matchId, ...matchMemberFilter(userId) },
      select: { id: true },
    });
    if (!match) return badRequestResponse('Match not found or access denied');
  }

  // Prevent endpoint hijack: if endpoint already belongs to another user, reject
  const existing = await prisma.pushSubscription.findUnique({ where: { endpoint }, select: { userId: true } });
  if (existing && existing.userId !== userId) {
    return badRequestResponse('Invalid subscription endpoint');
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { userId, endpoint, p256dh, auth, matchId: matchId ?? null },
    update: { userId, p256dh, auth, matchId: matchId ?? null },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await getAuthSession();
  if (!userId) return unauthorizedResponse();

  const { endpoint } = await req.json();
  if (!endpoint) return badRequestResponse('endpoint required');

  await prisma.pushSubscription.deleteMany({
    where: { endpoint, userId },
  });

  return NextResponse.json({ success: true });
}
