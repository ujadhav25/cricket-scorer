'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const GA_ID = 'G-R2QNLWWCEH';

/**
 * Fires a GA4 page_view on every client-side route change.
 * Mounted once at the root layout — no per-page boilerplate needed.
 */
export function Analytics() {
  const pathname = usePathname();
  const prevPath = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window.gtag !== 'function') return;
    if (pathname === prevPath.current) return;

    window.gtag('config', GA_ID, {
      page_path: pathname,
      page_title: document.title,
    });

    prevPath.current = pathname;
  }, [pathname]);

  return null;
}
