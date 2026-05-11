# 🏏 CricScorer

Real-time ball-by-ball cricket scoring platform with live scoreboards, tournament management, player analytics, and PWA support.

**Live:** [cricscorer.co.in](https://cricscorer.co.in)


---

## Features

- **Live Scoring** — Ball-by-ball input with extras, wickets, and over summaries. Real-time updates via Pusher WebSockets.
- **Tournaments** — 4 formats: League, Knockout, Group Stage, and Bilateral series. Standings auto-calculated.
- **Player Profiles** — Career stats, batting/bowling averages, match history, and performance charts.
- **Teams** — Invite players via QR code or link. Captain assignment, team colors, home ground.
- **Public Scoreboards** — Shareable live scorecard links (no login required for spectators).
- **Embed Widget** — Embeddable live scoreboard for external websites via `<iframe>`.
- **Push Notifications** — Web Push API for live match alerts.
- **PWA** — Installable on mobile/desktop, offline-capable service worker.
- **Two Views** — Organizer view (manage matches, teams, tournaments) and Player view (personal stats).
- **Authentication** — Google OAuth and magic-link email sign-in via NextAuth v5.
- **Error Monitoring** — Sentry integration with session replay, structured logging, and source map uploads.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (Neon) via Prisma 7 |
| Auth | NextAuth v5 + Google OAuth |
| Realtime | Pusher WebSockets |
| Styling | Tailwind CSS + Radix UI |
| Animations | Framer Motion |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| State | Zustand |
| Push | Web Push API |
| Monitoring | Sentry |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (or a [Neon](https://neon.tech) free tier account)
- [Pusher](https://pusher.com) app (free tier works)
- Google OAuth credentials ([console.cloud.google.com](https://console.cloud.google.com))

### Installation

```bash
git clone https://github.com/ujadhav25/cricket-scorer.git
cd cricket-scorer
npm install
```

### Environment Variables

Copy `.env` and fill in the values:

```bash
cp .env .env.local
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret for NextAuth JWT signing |
| `NEXTAUTH_URL` | App base URL (e.g. `http://localhost:3000`) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `PUSHER_APP_ID` | Pusher app ID |
| `PUSHER_KEY` | Pusher key |
| `PUSHER_SECRET` | Pusher secret |
| `PUSHER_CLUSTER` | Pusher cluster (e.g. `ap2`) |
| `NEXT_PUBLIC_PUSHER_KEY` | Pusher key (client-side) |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | Pusher cluster (client-side) |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN for error monitoring |
| `SENTRY_AUTH_TOKEN` | Sentry auth token for source map uploads |
| `SENTRY_ORG` | Sentry organisation slug |
| `SENTRY_PROJECT` | Sentry project slug |

### Database Setup

```bash
npm run prisma:migrate   # create/apply migrations in development
npm run prisma:generate  # generate Prisma Client
npm run prisma:studio    # open Prisma Studio (optional)
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run prisma:migrate` | Run Prisma migrations (dev) |
| `npm run migrate:deploy` | Apply migrations in production |
| `npm run prisma:generate` | Regenerate Prisma Client |
| `npm run prisma:studio` | Open Prisma Studio GUI |
| `npm run sentry:sourcemaps` | Manually upload source maps to Sentry |

---

## Project Structure

```
├── app/
│   ├── (auth)/          # Login, signup, verify pages
│   ├── (protected)/     # Authenticated app: dashboard, matches, teams, etc.
│   ├── admin/           # Super-admin panel
│   ├── api/             # API routes
│   ├── embed/           # Public embeddable scorecard
│   └── m/               # Public match scorecard (share link)
├── components/
│   ├── layout/          # Sidebar and bottom navigation
│   ├── scoring/         # Ball input, scoreboard, over summary
│   ├── ui/              # Reusable UI primitives (shadcn/ui)
│   └── animations/      # Boundary, six, wicket animations
├── lib/                 # Auth, Prisma client, logger, rate limiter, Pusher, etc.
├── prisma/              # Schema and migrations
├── store/               # Zustand scoring state
└── public/              # Static assets, PWA manifest, service worker
```

---

## Data Models

- **User** — Organizer or Player role, linked Google/email account
- **Player** — Cricket profile with batting/bowling style and career stats
- **Team** — Roster with captain, colors, and join token
- **Match** — Two teams, innings, ball-by-ball deliveries, MOTM
- **Tournament** — League / Knockout / Group Stage / Bilateral with standings
- **Innings / Over / Delivery** — Full ball-by-ball scoring data

---

## Authentication

- Google OAuth (one-click sign-in)
- Email magic link (optional — set `EMAIL_SERVER` env var)
- A `Player` record is automatically created for every new account

---

## Deployment

The app is deployed on **Vercel**. Set all environment variables in **Vercel → Project → Settings → Environment Variables**.

For Sentry source map uploads to work in CI, the `SENTRY_AUTH_TOKEN` must have the `project:releases` and `org:read` scopes.

```bash
# Production build (source maps uploaded to Sentry automatically)
npm run build
```

---

## Rate Limiting

In-memory sliding-window rate limiter applied in middleware:

| Route group | Limit |
|---|---|
| Auth (`/api/auth/signin`) | 10 req / min |
| Join links | 20 req / min |
| General API | 120 req / min |
| Scoring API | 240 req / min |

> For multi-region deployments, swap the in-memory store for [Upstash Redis](https://upstash.com).

---

## License

ISC
