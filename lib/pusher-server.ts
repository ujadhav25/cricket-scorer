import Pusher from 'pusher';
export { matchChannel, PUSHER_EVENTS } from '@/lib/pusher';

// Server-side Pusher instance — Node.js only, never import this in client components
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID ?? '',
  key: process.env.PUSHER_KEY ?? '',
  secret: process.env.PUSHER_SECRET ?? '',
  cluster: process.env.PUSHER_CLUSTER ?? 'ap2',
  useTLS: true,
});
