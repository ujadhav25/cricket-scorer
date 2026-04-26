'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Immediately hard-navigates to `to` on mount if we are not already there.
 * Uses window.location.href instead of router.replace to avoid Next.js
 * RSC 404s on uncompiled dynamic routes during first-login client navigation.
 */
export function ClientNavigate({ to }: { to: string }) {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== to) {
      window.location.href = to;
    }
  }, [to, pathname]);

  return null;
}
