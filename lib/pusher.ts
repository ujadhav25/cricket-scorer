import PusherClient from 'pusher-js';

export const PUSHER_EVENTS = {
  BALL_RECORDED: 'ball-recorded',
  INNINGS_CHANGED: 'innings-changed',
  MATCH_COMPLETED: 'match-completed',
  SCORE_UPDATE: 'score-update',
} as const;

export function matchChannel(matchId: string) {
  return `match-${matchId}`;
}

// Client-side Pusher instance (singleton)
let pusherClientInstance: PusherClient | null = null;

export function getPusherClient(): PusherClient {
  if (!pusherClientInstance) {
    pusherClientInstance = new PusherClient(
      process.env.NEXT_PUBLIC_PUSHER_KEY ?? '',
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? 'ap2',
      }
    );
  }
  return pusherClientInstance;
}

export const PUSHER_EVENTS = {
  BALL_RECORDED: 'ball-recorded',
  INNINGS_CHANGED: 'innings-changed',
  MATCH_COMPLETED: 'match-completed',
  SCORE_UPDATE: 'score-update',
} as const;

export function matchChannel(matchId: string) {
  return `match-${matchId}`;
}
