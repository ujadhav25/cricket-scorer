// SSE pub/sub using Node.js EventEmitter.
// Stored on globalThis so it survives hot-module reloads in dev.
import { EventEmitter } from 'events';

const g = globalThis as any;
if (!g._sseEmitter) {
  const em = new EventEmitter();
  em.setMaxListeners(500);
  g._sseEmitter = em;
}

const emitter: EventEmitter = g._sseEmitter;

export interface SsePayload {
  event: string;
  data?: Record<string, unknown>;
}

export const sseHub = {
  /** Called by the /live route when a viewer connects. Returns an unsub fn. */
  subscribe(matchId: string, onEvent: (payload: SsePayload) => void): () => void {
    emitter.on(`m:${matchId}`, onEvent);
    return () => emitter.off(`m:${matchId}`, onEvent);
  },

  /** Called by ball/innings/complete routes to push an event to all viewers. */
  emit(matchId: string, event = 'update', data?: Record<string, unknown>) {
    emitter.emit(`m:${matchId}`, { event, data });
  },
};
