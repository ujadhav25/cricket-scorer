import type { Metadata } from 'next';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'CricScorer privacy policy — how we collect, use, and protect your data.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="mx-auto max-w-3xl px-6 py-16">
        {/* Back link */}
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to CricScorer
        </Link>

        {/* Title */}
        <div className="mb-10 flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cricket-green-500/10">
            <Shield className="h-5 w-5 text-cricket-green-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Privacy Policy</h1>
            <p className="mt-1 text-sm text-muted-foreground">Last updated: April 29, 2026</p>
          </div>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-muted-foreground">

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">1. Introduction</h2>
            <p>
              CricScorer (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) operates the CricScorer platform at{' '}
              <span className="text-foreground font-medium">cricscorer.co.in</span>. This Privacy Policy explains how we
              collect, use, and protect information when you use our service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">2. Information We Collect</h2>
            <p>We collect the following information:</p>
            <ul className="ml-4 list-disc space-y-2">
              <li>
                <span className="text-foreground font-medium">Account information</span> — your name, email address, and
                profile photo provided via Google Sign-In.
              </li>
              <li>
                <span className="text-foreground font-medium">Player profile data</span> — phone number, cricket stats,
                match history, and any information you voluntarily enter.
              </li>
              <li>
                <span className="text-foreground font-medium">Match & tournament data</span> — scores, ball-by-ball
                events, team compositions, and results you record.
              </li>
              <li>
                <span className="text-foreground font-medium">Usage data</span> — pages visited, features used, and
                general interaction patterns to improve the service.
              </li>
              <li>
                <span className="text-foreground font-medium">Push notification tokens</span> — if you opt in, we store
                a device token to send live score updates.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">3. How We Use Your Information</h2>
            <ul className="ml-4 list-disc space-y-2">
              <li>Provide, maintain, and improve the CricScorer service.</li>
              <li>Display your cricket profile, stats, and match history.</li>
              <li>Send live score push notifications you subscribed to.</li>
              <li>Enable public scorecards and shared tournament pages.</li>
              <li>Respond to support requests you submit.</li>
              <li>Detect and prevent abuse or unauthorised access.</li>
            </ul>
            <p>We do not sell your personal data to any third party.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">4. Public Data</h2>
            <p>
              Certain data is public by design: match scorecards, tournament leaderboards, and player profiles may be
              accessible via shareable links without requiring a login. Only data you actively record in matches or enter
              in your profile is made public this way. You may delete matches or adjust your profile at any time.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">5. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul className="ml-4 list-disc space-y-2">
              <li>
                <span className="text-foreground font-medium">Google OAuth</span> — for authentication. Google&apos;s
                privacy policy applies to data handled by Google.
              </li>
              <li>
                <span className="text-foreground font-medium">Pusher</span> — for real-time live score delivery. Only
                match event data is transmitted.
              </li>
              <li>
                <span className="text-foreground font-medium">Hosting infrastructure</span> — your data is stored on
                servers located in the region serving the application.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">6. Data Retention & Deletion</h2>
            <p>
              We retain your data for as long as your account is active. You may request deletion of your account and
              associated data at any time by contacting us at the address below. We will process deletion requests
              within 30 days.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">7. Cookies & Local Storage</h2>
            <p>
              We use session cookies for authentication and browser local/session storage to remember your preferences
              (e.g., theme, view mode). We do not use advertising or tracking cookies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">8. Children&apos;s Privacy</h2>
            <p>
              CricScorer is not directed at children under 13. We do not knowingly collect personal data from children.
              If you believe a child has provided us with personal information, please contact us so we can delete it.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Material changes will be indicated by updating the
              &ldquo;Last updated&rdquo; date at the top of this page. Continued use of the service after changes
              constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">10. Contact Us</h2>
            <p>
              For privacy-related questions or data deletion requests, please reach out via our{' '}
              <Link href="/contact" className="text-cricket-green-500 underline underline-offset-4 hover:text-cricket-green-400 transition-colors">
                contact page
              </Link>
              .
            </p>
          </section>
        </div>

        {/* Footer nav */}
        <div className="mt-12 flex flex-wrap gap-4 border-t border-border/40 pt-8 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
        </div>
      </div>
    </div>
  );
}
