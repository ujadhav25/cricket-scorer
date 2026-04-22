import webpush from 'web-push';
import { prisma } from '@/lib/prisma';

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? '';
const VAPID_MAILTO = process.env.VAPID_MAILTO ?? 'mailto:admin@cricscorer.app';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_MAILTO, VAPID_PUBLIC, VAPID_PRIVATE);
}

export async function sendMatchPushNotification(
  matchId: string,
  title: string,
  body: string,
  url?: string,
) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return;

  const subs = await prisma.pushSubscription.findMany({
    where: { OR: [{ matchId }, { matchId: null }] },
  });

  const payload = JSON.stringify({ title, body, url: url ?? `/matches/${matchId}` });

  await Promise.allSettled(
    subs.map((sub) =>
      webpush
        .sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        )
        .catch(async (err: any) => {
          // Remove expired/invalid subscriptions
          if (err.statusCode === 404 || err.statusCode === 410) {
            await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } }).catch(() => {});
          }
        }),
    ),
  );
}
