'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function Error({
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
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h2 className="text-2xl font-bold">Something went wrong</h2>
      <p className="max-w-md text-muted-foreground">
        An unexpected error occurred. We&apos;ve been notified and are looking into it.
      </p>
      {error.digest && (
        <p className="font-mono text-xs text-muted-foreground">Error ID: {error.digest}</p>
      )}
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
