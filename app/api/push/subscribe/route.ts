import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession, unauthorizedResponse, badRequestResponse } from '@/lib/api-helpers';
import { z } from 'zod';

const SubscribeSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string(),
  auth: z.string(),
  matchId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const { userId } = await getAuthSession();
  if (!userId) return unauthorizedResponse();

  const body = await req.json();
  const result = SubscribeSchema.safeParse(body);
  if (!result.success) return badRequestResponse('Invalid subscription data');

  const { endpoint, p256dh, auth, matchId } = result.data;

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: {
      userId,
      endpoint,
      p256dh,
      auth,
      matchId: matchId ?? null,
    },
    update: {
      p256dh,
      auth,
      matchId: matchId ?? null,
    },
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
