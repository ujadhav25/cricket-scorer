'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { LocaleProvider } from '@/components/LocaleProvider';
import type { Locale } from '@/lib/i18n';

export function Providers({ children, initialLocale }: { children: React.ReactNode; initialLocale?: Locale }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange={false}>
        <LocaleProvider initialLocale={initialLocale}>
          {children}
        </LocaleProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
