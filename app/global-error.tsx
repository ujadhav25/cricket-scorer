'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

// global-error replaces the root layout, so it must include <html> and <body>.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center text-foreground">
        <h2 className="text-2xl font-bold">Something went wrong</h2>
        <p className="max-w-md text-muted-foreground">
          A critical error occurred. Please try reloading the page.
        </p>
        {error.digest && (
          <p className="font-mono text-xs text-muted-foreground">Error ID: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
