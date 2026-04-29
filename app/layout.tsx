import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import { Providers } from '@/components/Providers';
import { Analytics } from '@/components/Analytics';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.NODE_ENV === 'production'
        ? 'https://cricscorer.co.in'
        : 'http://localhost:3000')
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
    icon: [
      { url: '/icons/icon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icons/icon-96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-180.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/icons/icon-96.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'CricScorer',
    url: 'https://cricscorer.co.in',
    title: 'CricScorer — Real-time Cricket Scoring',
    description:
      'Score cricket matches in real-time, manage tournaments, track player stats and share live scoreboards with spectators.',
  },
  alternates: {
    canonical: 'https://cricscorer.co.in',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CricScorer — Real-time Cricket Scoring',
    description:
      'Score cricket matches in real-time, manage tournaments, track player stats and share live scoreboards with spectators.',
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

const isProd = process.env.NODE_ENV === 'production';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen`}>
        {/* Google Analytics 4 — production only */}
        {isProd && (
          <>
            <Script
              src="https://www.googletagmanager.com/gtag/js?id=G-R2QNLWWCEH"
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-R2QNLWWCEH', { send_page_view: false });
              `}
            </Script>
          </>
        )}
        <Analytics />
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
