import type { Metadata } from 'next';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Mail, ExternalLink, MessageCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact & Support',
  description: 'Get help with CricScorer — report bugs, ask questions, or send feedback.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="mx-auto max-w-2xl px-6 py-16">
        {/* Back link */}
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to CricScorer
        </Link>

        {/* Title */}
        <div className="mb-10">
          <h1 className="text-3xl font-black tracking-tight">Contact &amp; Support</h1>
          <p className="mt-2 text-muted-foreground">
            Need help, found a bug, or want to share feedback? Here&apos;s how to reach us.
          </p>
        </div>

        {/* Contact cards */}
        <div className="space-y-4">

          {/* Email */}
          <a
            href="mailto:support@cricscorer.co.in"
            className="group flex items-start gap-4 rounded-2xl border border-border/50 bg-card p-6 transition-colors hover:border-cricket-green-500/40 hover:bg-card/80"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cricket-green-500/10 text-cricket-green-500 group-hover:bg-cricket-green-500/20 transition-colors">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Email Support</p>
              <p className="mt-0.5 text-sm text-muted-foreground">support@cricscorer.co.in</p>
              <p className="mt-1.5 text-xs text-muted-foreground/70">
                Best for account issues, data requests, or anything private. We aim to reply within 48 hours.
              </p>
            </div>
          </a>

          {/* GitHub Issues */}
          <a
            href="https://github.com/cricscorer/cricscorer/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-4 rounded-2xl border border-border/50 bg-card p-6 transition-colors hover:border-cricket-green-500/40 hover:bg-card/80"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cricket-green-500/10 text-cricket-green-500 group-hover:bg-cricket-green-500/20 transition-colors">
              <ExternalLink className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground">GitHub Issues</p>
              <p className="mt-0.5 text-sm text-muted-foreground">github.com/cricscorer/cricscorer</p>
              <p className="mt-1.5 text-xs text-muted-foreground/70">
                Report bugs or request features. Public issue tracker — please don&apos;t share personal information here.
              </p>
            </div>
          </a>

          {/* Community / WhatsApp or general feedback */}
          <div className="flex items-start gap-4 rounded-2xl border border-border/50 bg-card p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cricket-green-500/10 text-cricket-green-500">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground">General Feedback</p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Have a suggestion or want to share how you&apos;re using CricScorer? Drop us an email — we love hearing
                from the cricket community.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12">
          <h2 className="mb-6 text-xl font-bold">Common Questions</h2>
          <div className="space-y-5">
            {[
              {
                q: 'Is CricScorer free?',
                a: 'Yes — CricScorer is completely free. No credit card, no hidden charges, no premium tier.',
              },
              {
                q: 'Can I delete my account?',
                a: 'Yes. Email us at support@cricscorer.co.in and we will delete your account and associated data within 30 days.',
              },
              {
                q: 'My match data looks wrong — what should I do?',
                a: 'Match scorers can edit or delete matches from the match detail page. If you no longer have access, contact support with the match details.',
              },
              {
                q: 'How do push notifications work?',
                a: "When you subscribe to a match's push notifications, we send ball-by-ball updates to your device. You can unsubscribe at any time from your browser's notification settings or from the match page.",
              },
              {
                q: 'Can I embed a scorecard on my website?',
                a: 'Yes — from any live or completed match, use the Share button to get an embeddable widget code.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="rounded-xl border border-border/40 bg-card/50 p-5">
                <p className="font-semibold text-foreground">{q}</p>
                <p className="mt-1.5 text-sm text-muted-foreground">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer nav */}
        <div className="mt-12 flex flex-wrap gap-4 border-t border-border/40 pt-8 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
        </div>
      </div>
    </div>
  );
}
