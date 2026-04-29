/** @type {import('next').NextConfig} */
const { version } = require('./package.json');
const { withSentryConfig } = require('@sentry/nextjs');

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://lh3.googleusercontent.com https://res.cloudinary.com https://www.google-analytics.com",
      "font-src 'self'",
      "connect-src 'self' https://*.pusher.com wss://*.pusher.com https://*.neon.tech https://accounts.google.com https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com",
      "frame-src https://accounts.google.com",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
  async headers() {
    return [
      {
        // Apply security headers to page routes only.
        // Exclude: API routes, static assets, OG image, icons, SW, manifest.
        source: '/((?!api|_next/static|_next/image|opengraph-image|icons|sw\\.js|manifest\\.json).*)',
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
};

module.exports = withSentryConfig(nextConfig, {
  // Source map upload — set SENTRY_ORG, SENTRY_PROJECT, SENTRY_AUTH_TOKEN in CI
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT ?? 'javascript-nextjs',

  // Suppress build-time output unless in CI
  silent: !process.env.CI,

  // Wider source map uploads for better stack traces
  widenClientFileUpload: true,

  // Hide source maps from the client bundle
  hideSourceMaps: true,

  // Tunnel Sentry events through /api/monitoring to bypass adblockers
  tunnelRoute: '/api/monitoring',

  // Don't fail the build if source map upload fails (e.g. bad token)
  errorHandler(err, invokeErr, compilation) {
    compilation.warnings.push('Sentry source map upload warning: ' + err.message);
  },

  webpack: {
    // Tree-shake Sentry logger statements in production (replaces deprecated disableLogger)
    treeshake: {
      removeDebugLogging: true,
    },
    // Disable automatic Vercel Cron Monitors (replaces deprecated automaticVercelMonitors)
    automaticVercelMonitors: false,
  },
});
