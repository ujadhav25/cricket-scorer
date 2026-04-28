/**
 * In-memory sliding-window rate limiter.
 *
 * NOTE: Works perfectly on a single instance (local dev / single Vercel region).
 * For multi-region production, swap the Map for an Upstash Redis client.
 *
 * Usage:
 *   const result = rateLimit(identifier, { limit: 20, windowMs: 60_000 });
 *   if (!result.success) return rateLimitResponse(result.retryAfter);
 */

interface Window {
  count: number;
  resetAt: number;
}

// Global map — survives across requests on the same warm instance.
const store = new Map<string, Window>();

// Periodically prune expired entries to avoid unbounded memory growth.
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, win] of store) {
      if (win.resetAt < now) store.delete(key);
    }
  }, 60_000);
}

export interface RateLimitOptions {
  /** Max requests allowed in the window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  /** Remaining requests in the current window */
  remaining: number;
  /** Seconds until the window resets (only set when success === false) */
  retryAfter?: number;
}

export function rateLimit(
  identifier: string,
  { limit, windowMs }: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const existing = store.get(identifier);

  if (!existing || existing.resetAt < now) {
    // New window
    store.set(identifier, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  existing.count++;

  if (existing.count > limit) {
    return {
      success: false,
      remaining: 0,
      retryAfter: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  return { success: true, remaining: limit - existing.count };
}

/**
 * Pre-configured limiters
 *
 * auth      — 10 req / 60 s   (brute-force protection on login/signup)
 * join      — 20 req / 60 s   (prevent invite-link spam)
 * api       — 120 req / 60 s  (comfortable limit for normal app usage)
 * scoring   — 240 req / 60 s  (scoring is chatty — ball-by-ball updates)
 */
export const limiters = {
  auth:    (ip: string) => rateLimit(`auth:${ip}`,    { limit: 10,  windowMs: 60_000 }),
  join:    (ip: string) => rateLimit(`join:${ip}`,    { limit: 20,  windowMs: 60_000 }),
  api:     (ip: string) => rateLimit(`api:${ip}`,     { limit: 120, windowMs: 60_000 }),
  scoring: (ip: string) => rateLimit(`scoring:${ip}`, { limit: 240, windowMs: 60_000 }),
} as const;
