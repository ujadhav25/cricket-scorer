import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import { Providers } from '@/components/Providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Cricket Scorer',
  description: 'Real-time cricket scoring, tournaments and stats',
  manifest: '/manifest.json',
  icons: { apple: '/icons/icon-192.png' },
};

export const viewport: Viewport = {
  themeColor: '#16a34a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className={`${inter.className} min-h-screen`}>
        <ServiceWorkerRegistration />
        <Providers>
          <Toaster>
            {children}
          </Toaster>
        </Providers>
      </body>
    </html>
  );
}
