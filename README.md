# CreatorLoop

Local creators, real customers. CreatorLoop connects Goa businesses (cafés, restaurants, hotels, shops) with local creators who make reels for them. AI writes the briefs, suggests creators, plans the calendar and sums up each month; people shoot, edit and decide.

Installable web app (PWA). Wrap for Google Play with Capacitor once there are paying clients.

## Stack

Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS 4 · Framer Motion · Supabase (Postgres, Auth, Storage) · Claude API · Netlify

## What works

| Role | Can do |
| --- | --- |
| Business | Set up their business, answer 5 questions and get an AI brief, send it to creators, review each reel (approve or request changes), get a 4-week content plan, log results and get a monthly report |
| Creator | Build a profile, browse open briefs, apply, upload reels for an assigned brief, see feedback, track payouts |
| Admin | See work queues, get an AI shortlist, assign a creator and set their pay, verify creators, close approved briefs, track payouts |

Money: an admin sets each business's plan and monthly reel allowance and raises invoices; businesses pay by UPI from the invoice and the admin marks it paid. Creator payouts are tracked the same way. The app records payments but does not move money.

**Going live? Follow [docs/LAUNCH.md](docs/LAUNCH.md).**

## Set up (one time)

1. **Supabase**: create a project (free tier is fine).
2. **Database**: in the Supabase *SQL Editor*, run each file in `supabase/migrations/` in order, lowest number first.
3. **Auth**: *Authentication → URL Configuration*. Set Site URL to your site (locally `http://localhost:3000`) and add `<site>/auth/confirm` to Redirect URLs. Keep email confirmation on. Turn on CAPTCHA before a public launch.
4. **Env**: `cp .env.example .env.local`, then fill in the Supabase URL and publishable key (*Project Settings → API*) and `ANTHROPIC_API_KEY` (console.anthropic.com).
5. **Run**: `npm install && npm run dev`, open http://localhost:3000.
6. **Make yourself admin**: sign up in the app, then in the SQL Editor run
   `update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');`

Uploads are limited to 50 MB MP4/MOV/WebM. Supabase's free tier also caps files at 50 MB.

## Deploy (Netlify)

Connect the repo. `netlify.toml` sets the build. Add the same variables as `.env.local` in *Site settings → Environment variables*, with `NEXT_PUBLIC_SITE_URL` set to the live URL, then update the Supabase Auth URLs to match.

## How a brief moves

`draft` → business sends it (needs a plan with reels left this month) → `open` → admin assigns a creator → `assigned` → creator uploads → `in_review` → business approves enough reels → `approved` → admin closes and creates the payout → `completed`.

The database moves the middle steps itself as reels are uploaded and reviewed, so nobody can skip ahead.

## Security

Access rules live in Postgres (row-level security and triggers), not just in the UI, and each phase was audited:

- [Phases 1–2](docs/security/phase-1-2-audit.md) · [Phase 3](docs/security/phase-3-audit.md) · [Phase 4](docs/security/phase-4-audit.md) · [Phase 5](docs/security/phase-5-audit.md) · [Final review and live test](docs/security/final-review.md) · [Launch work](docs/security/launch-audit.md)

Highlights: nobody can pick admin at signup or change their own role; businesses see only their own data; creators see open briefs and their own work; videos are private and served through one-hour signed links; paid payouts are locked; assignments, payouts, verification and role changes are written to an append-only audit trail; AI use is capped per account per day.

## Tests

```bash
npm test          # unit tests (validation, redirects, dates)
npm run test:ai   # AI generators against a local stand-in for the Anthropic API
npm run test:db   # 86 access-rule checks on a throwaway local Postgres (needs psql; set PGHOST/PGUSER)
npm run typecheck && npm run lint && npm run build
```

`test:db` prints `ID what -> actual (expect expected)` for each check and exits non-zero on any mismatch. `ERROR` lines are blocked actions and are expected.

## AI features

| Feature | Where | Limits |
| --- | --- | --- |
| Brief writer | `src/lib/ai/brief.ts` | 4 writes per brief, 30 a day per account |
| Creator shortlist (admin) | `src/lib/ai/match.ts` | 40 a day |
| 4-week content plan | `src/lib/ai/plan.ts` | 5 a day |
| Monthly report summary | `src/lib/ai/plan.ts` | 5 a day |

All output is schema-validated and shown as plain text. Report figures are computed from the database; the AI only writes commentary. Prompts forbid inventing prices, offers, hours or numbers. Set `ANTHROPIC_MODEL` to switch models. Without a key, everything else still works and pages say AI is unavailable.

## Project map

```
src/
  app/
    page.tsx              landing page
    (auth)/               login, signup, server actions
    auth/confirm/         email-confirmation link handler
    dashboard/            sends each role to its home
    business/             briefs, reel review, content plan, report, billing, onboarding
    creator/              home, open briefs, brief + upload, earnings, profile
    admin/                overview, briefs + assignment, creators, businesses + plans + invoices, payouts
    terms/ privacy/       public legal pages
    reset-password/       set a new password from the emailed link
  components/             UI kit, app shell, navigation, brief view, reel player
  config/site.ts          pricing plans and FAQ copy (edit here)
  lib/
    auth.ts               current user and role guards
    business.ts creator.ts admin.ts report.ts   data access per role
    briefs.ts creators.ts ai-docs.ts            schemas and limits
    ai/                   Claude client, generators, usage caps
    safe.ts               redirect, URL, handle and prompt-text sanitisers
    supabase/             server, browser and proxy clients + DB types
  proxy.ts                session refresh + first-line route protection
public/sw.js              service worker (static assets only)
supabase/migrations/      schema, access rules, storage, audit trail
supabase/tests/           access-rule tests
tests/                    unit and AI tests
docs/security/            audit reports
```
