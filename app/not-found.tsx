import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page not found',
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="text-6xl font-bold text-green-600">404</div>
      <h2 className="text-2xl font-bold">Page not found</h2>
      <p className="max-w-md text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Button asChild>
        <Link href="/dashboard">
          <Home className="mr-2 h-4 w-4" />
          Go to Dashboard
        </Link>
      </Button>
    </div>
  );
}
