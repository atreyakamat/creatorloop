# CreatorLoop

Local creators, real customers. CreatorLoop connects Goa businesses (cafés, restaurants, hotels, shops) with local creators who make reels for them. AI writes the briefs, plans the calendar and reports on what worked; people shoot and edit.

Installable web app (PWA). Wrap for Google Play with Capacitor once there are paying clients.

## Stack

Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS 4 · Framer Motion · Supabase (Postgres, Auth, Storage) · Claude API (Phase 2) · Netlify

## Status

| Phase | Scope | State |
| --- | --- | --- |
| 1 | Scaffold, auth, database + access rules, landing page, PWA | ✅ Done |
| 2 | Business onboarding + AI brief generator (Claude) | ✅ Done |
| 3 | Creator profiles, open briefs, applications, video uploads, reel review | ✅ Done |
| 4 | Admin panel, payouts, deploy | |
| 5 | Pilot with 2–3 Goa businesses | |

## Set up (one time)

1. **Supabase**: create a project at supabase.com (free tier is fine).
2. **Database**: in the Supabase dashboard, open *SQL Editor* and run each file in `supabase/migrations/` in order, lowest number first.
3. **Auth URLs**: *Authentication → URL Configuration*. Set Site URL to `http://localhost:3000` (later your Netlify URL) and add `<site>/auth/confirm` to Redirect URLs.
4. **Env**: `cp .env.example .env.local`, then fill in the URL and publishable key from *Project Settings → API*, and your `ANTHROPIC_API_KEY` (console.anthropic.com) for AI briefs.
5. **Run**: `npm install && npm run dev` and open http://localhost:3000.
6. **Make yourself admin**: sign up in the app, then in the SQL Editor run
   `update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');`

## Roles and access

- **business**: owns businesses and briefs, reviews submissions for its own briefs.
- **creator**: edits own profile, sees only briefs assigned to them, uploads to their own storage folder.
- **admin**: sees and manages everything, the only role that can write payouts.

Rules are enforced in Postgres with row-level security, not just in the UI. Nobody can pick `admin` at signup or change their own role.

Businesses also can't assign creators, skip a brief ahead to approved, or reset their AI usage; those are database triggers too.

Test them against a local Postgres:

```bash
PGHOST=localhost PGUSER=postgres ./supabase/tests/run.sh
```

Every `T…`/`G…` line should match its `(expect …)`. `ERROR` lines are blocked actions and are expected.

## AI briefs

`src/lib/ai/brief.ts` sends the business profile and the owner's five answers to Claude and gets back a typed brief (title, concept, 3 hooks, shot list, 2 captions, hashtags, audio mood, posting time, creator notes). Output is schema-validated (`src/lib/briefs.ts`).

- Limits: 4 AI writes per brief (first draft + 3 rewrites), 10 new briefs per business per day.
- The prompt forbids inventing prices, offers or opening hours the owner didn't give.
- Without `ANTHROPIC_API_KEY` the answers still save and the page explains AI is off; no usage is consumed.
- Set `ANTHROPIC_MODEL` to switch models.

## Project map

```
src/
  app/
    page.tsx              landing page
    (auth)/               login, signup, server actions
    auth/confirm/         email-confirmation link handler
    dashboard/            sends each role to its home
    business/             dashboard, onboarding, briefs (new + view), server actions
    creator/ admin/       role dashboards
    manifest.ts           PWA manifest
  components/             UI kit, app shell, landing animations
  config/site.ts          pricing plans and FAQ copy (edit here)
  lib/
    auth.ts               data access layer: current user, role guards
    business.ts           business + brief queries
    briefs.ts             questionnaire + AI output schemas, limits
    ai/brief.ts           Claude brief generator
    supabase/             server, browser and proxy clients + DB types
  proxy.ts                session refresh + optimistic route protection
public/sw.js              service worker (static assets only; never caches signed-in pages)
supabase/migrations/      schema, RLS, storage bucket
supabase/tests/           access-rule tests
```

## Deploy (Netlify)

Connect the repo, build command `npm run build`, and add the same env vars from `.env.local`. Netlify's Next.js runtime is picked up automatically.
