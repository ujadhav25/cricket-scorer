'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ProtectedError({
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
      <AlertTriangle className="h-10 w-10 text-destructive" />
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        An unexpected error occurred. We&apos;ve been notified.
      </p>
      {error.digest && (
        <p className="font-mono text-xs text-muted-foreground">ID: {error.digest}</p>
      )}
      <Button size="sm" variant="outline" onClick={reset}>
        <RefreshCw className="mr-2 h-3.5 w-3.5" />
        Try again
      </Button>
    </div>
  );
}
