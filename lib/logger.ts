/**
 * Structured server-side logger.
 *
 * In production, errors and warnings are also reported to Sentry so they
 * appear in the issue tracker with full context.  In development, output
 * goes only to the console.
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.error('Failed to save match', error, { matchId });
 */

import * as Sentry from '@sentry/nextjs';

type LogContext = Record<string, unknown>;

const isProd = process.env.NODE_ENV === 'production';

export const logger = {
  /**
   * Log an error. Captures the exception in Sentry in production.
   */
  error(message: string, error?: unknown, context?: LogContext): void {
    console.error(`[ERROR] ${message}`, ...(error ? [error] : []), ...(context ? [context] : []));

    if (isProd && process.env.NEXT_PUBLIC_SENTRY_DSN) {
      if (error instanceof Error) {
        Sentry.captureException(error, {
          extra: { message, ...context },
        });
      } else {
        Sentry.captureMessage(message, {
          level: 'error',
          extra: { error, ...context },
        });
      }
    }
  },

  /**
   * Log a warning. Sent to Sentry as a warning-level message in production.
   */
  warn(message: string, context?: LogContext): void {
    console.warn(`[WARN] ${message}`, ...(context ? [context] : []));

    if (isProd && process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureMessage(message, {
        level: 'warning',
        extra: context,
      });
    }
  },

  /**
   * Log an informational message (development only — no-op in production).
   */
  info(message: string, context?: LogContext): void {
    if (!isProd) {
      console.info(`[INFO] ${message}`, ...(context ? [context] : []));
    }
  },
};
