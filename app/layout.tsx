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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  ),
  title: {
    default: 'CricScorer — Real-time Cricket Scoring',
    template: '%s | CricScorer',
  },
  description:
    'Score cricket matches in real-time, manage tournaments, track player stats and share live scoreboards with spectators.',
  keywords: ['cricket', 'cricket scorer', 'live cricket score', 'cricket tournament', 'cricket stats'],
  authors: [{ name: 'CricScorer' }],
  creator: 'CricScorer',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'CricScorer',
    title: 'CricScorer — Real-time Cricket Scoring',
    description:
      'Score cricket matches in real-time, manage tournaments, track player stats and share live scoreboards with spectators.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'CricScorer — Real-time Cricket Scoring',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CricScorer — Real-time Cricket Scoring',
    description:
      'Score cricket matches in real-time, manage tournaments, track player stats and share live scoreboards with spectators.',
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#16a34a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
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
