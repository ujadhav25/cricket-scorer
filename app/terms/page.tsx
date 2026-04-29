import type { Metadata } from 'next';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'CricScorer terms of service — rules and conditions for using the platform.',
};

export default function TermsPage() {
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
            <FileText className="h-5 w-5 text-cricket-green-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Terms of Service</h1>
            <p className="mt-1 text-sm text-muted-foreground">Last updated: April 29, 2026</p>
          </div>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-muted-foreground">

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">1. Acceptance of Terms</h2>
            <p>
              By accessing or using CricScorer (&ldquo;the Service&rdquo;) at cricscorer.co.in, you agree to be bound
              by these Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">2. Description of Service</h2>
            <p>
              CricScorer is a free cricket scoring and tournament management platform. It provides ball-by-ball scoring,
              live spectator pages, player career analytics, tournament management, and related features. The Service is
              provided free of charge and may evolve or change at any time.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">3. Accounts</h2>
            <ul className="ml-4 list-disc space-y-2">
              <li>
                You must sign in using a valid Google account. You are responsible for all activity that occurs under
                your account.
              </li>
              <li>
                You must not share your account credentials or allow others to access your account.
              </li>
              <li>
                You must be at least 13 years old to create an account. By using the Service, you represent that you
                meet this requirement.
              </li>
              <li>
                We reserve the right to suspend or terminate accounts that violate these Terms.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="ml-4 list-disc space-y-2">
              <li>Use the Service for any unlawful purpose or in violation of any applicable laws.</li>
              <li>Upload or transmit harmful, abusive, defamatory, or offensive content.</li>
              <li>Attempt to gain unauthorised access to any part of the Service or its infrastructure.</li>
              <li>Scrape, crawl, or systematically extract data from the Service without written permission.</li>
              <li>Impersonate another person or entity.</li>
              <li>Interfere with or disrupt the integrity or performance of the Service.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">5. Your Content</h2>
            <p>
              You retain ownership of the cricket data, scores, and content you record. By submitting content to the
              Service, you grant us a worldwide, non-exclusive, royalty-free licence to store, display, and distribute
              that content solely for operating and improving the Service.
            </p>
            <p>
              Public scorecards and tournament pages you create may be accessible to anyone with the link. You are
              responsible for the accuracy of the data you record.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">6. Intellectual Property</h2>
            <p>
              The CricScorer name, logo, and all software, designs, and content created by us are the intellectual
              property of CricScorer. You may not reproduce, modify, or distribute them without prior written
              permission.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">7. Disclaimers</h2>
            <p>
              The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any
              kind, either express or implied. We do not guarantee that the Service will be uninterrupted, error-free,
              or free from viruses or other harmful components.
            </p>
            <p>
              We are not responsible for the accuracy of match data entered by users. Cricket statistics and results
              reflect only what has been recorded by users of the platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">8. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, CricScorer shall not be liable for any indirect, incidental,
              special, or consequential damages arising from your use of or inability to use the Service, even if we
              have been advised of the possibility of such damages.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">9. Termination</h2>
            <p>
              We may suspend or terminate your access to the Service at any time, with or without cause or notice. You
              may delete your account at any time by contacting us. Upon termination, your right to use the Service
              ceases immediately.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">10. Changes to Terms</h2>
            <p>
              We may update these Terms at any time. Continued use of the Service after changes are posted constitutes
              your acceptance of the revised Terms. We will update the &ldquo;Last updated&rdquo; date at the top of
              this page when changes are made.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">11. Governing Law</h2>
            <p>
              These Terms are governed by the laws of India. Any disputes arising from these Terms or your use of the
              Service shall be subject to the exclusive jurisdiction of the courts of India.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">12. Contact</h2>
            <p>
              Questions about these Terms? Please reach out via our{' '}
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
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
        </div>
      </div>
    </div>
  );
}
