import webpush from 'web-push';
import { prisma } from '@/lib/prisma';

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? '';
const VAPID_MAILTO = process.env.VAPID_MAILTO ?? 'mailto:admin@cricscorer.app';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_MAILTO, VAPID_PUBLIC, VAPID_PRIVATE);
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  // Rich score data for lock-screen score card
  score?: {
    teamA: string;
    teamB: string;
    scoreA: string; // e.g. "207/6 (20)"
    scoreB: string; // e.g. "92/7 (14.4)"
    status: string; // e.g. "MI need 115 runs in 32 balls"
    event?: string; // e.g. "WICKET" | "FOUR" | "SIX" | "FIFTY" | "CENTURY"
  };
}

export async function sendMatchPushNotification(
  matchId: string,
  title: string,
  body: string,
  url?: string,
  score?: PushPayload['score'],
) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return;

  // Only notify subscribers explicitly subscribed to this match
  // (avoids broadcasting private match updates to all global subscribers)
  const subs = await prisma.pushSubscription.findMany({
    where: { matchId },
  });

  const payload = JSON.stringify({ title, body, url: url ?? `/matches/${matchId}`, score });

  await Promise.allSettled(
    subs.map((sub) =>
      webpush
        .sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        )
        .catch(async (err: any) => {
          if (err.statusCode === 404 || err.statusCode === 410) {
            await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } }).catch(() => {});
          }
        }),
    ),
  );
}
