import { NextRequest, NextResponse } from 'next/server';
import { pusherServer, matchChannel } from '@/lib/pusher-server';
import { rateLimit } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';

const ALLOWED = ['🔥', '💥', '👏', '😱', '🏏', '⭐'];

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const rows = await prisma.matchReaction.findMany({
    where: { matchId: params.id },
    select: { emoji: true, count: true },
  });
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.emoji] = r.count;
  return NextResponse.json({ counts });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Rate limit: 10 reactions per 10s per IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const limit = rateLimit(`reaction:${ip}`, { limit: 10, windowMs: 10_000 });
  if (!limit.success) return NextResponse.json({ error: 'Too many reactions' }, { status: 429 });

  try {
    const { emoji } = await req.json();
    if (!ALLOWED.includes(emoji)) {
      return NextResponse.json({ error: 'Invalid emoji' }, { status: 400 });
    }

    // Upsert count in DB
    const updated = await prisma.matchReaction.upsert({
      where: { matchId_emoji: { matchId: params.id, emoji } },
      update: { count: { increment: 1 } },
      create: { matchId: params.id, emoji, count: 1 },
      select: { count: true },
    });

    // Broadcast to Pusher with updated total
    try {
      await pusherServer.trigger(matchChannel(params.id), 'reaction', {
        emoji,
        count: updated.count,
      });
    } catch {
      // Pusher not configured — skip
    }

    return NextResponse.json({ ok: true, count: updated.count });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
