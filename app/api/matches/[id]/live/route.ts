import { NextRequest } from 'next/server';
import { sseHub, type SsePayload } from '@/lib/sse';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const matchId = params.id;
  const enc = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(ctrl) {
      // Confirm connection
      ctrl.enqueue(enc.encode(': connected\n\n'));

      // Push SSE event to this client when a ball/innings/completion happens
      const onEvent = ({ event, data }: SsePayload) => {
        try {
          const payload = data ? JSON.stringify(data) : '{}';
          ctrl.enqueue(enc.encode(`event: ${event}\ndata: ${payload}\n\n`));
        } catch {
          // Client already gone — unsub is handled by req.signal below
        }
      };

      const unsub = sseHub.subscribe(matchId, onEvent);

      // Keep-alive ping every 15s so proxies don't drop the connection
      const heartbeat = setInterval(() => {
        try {
          ctrl.enqueue(enc.encode(': ping\n\n'));
        } catch {
          clearInterval(heartbeat);
        }
      }, 15_000);

      // req.signal fires when the HTTP connection closes (browser navigates away, etc.)
      req.signal.addEventListener('abort', () => {
        unsub();
        clearInterval(heartbeat);
        try { ctrl.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
