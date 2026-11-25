# CreatorLoop — TODO and project readiness checklist

Last checked: 2026-11-25. Repository: `github.com/atreyakamat/creatorloop`.
Status: code and tests pass locally (2026-11-25). The app is **not live yet**. Remaining work is live Supabase/Netlify setup and the three-browser smoke test.

## 1. TODO — do these in order

### P0 — Unblock deployment (do first)

- [x] Revert the TEMP debug commit on the `landing` branch (`1237d1b`). Restore `command = "npm run build"` in `netlify.toml`. Delete `netlify-debug-build.sh` and `.netlify/state.json`. Keep `NEXT_PUBLIC_LANDING_ONLY = "1"` there. Done in commit `3f1d44b`; pushed to `origin/landing`.
- [ ] Confirm the Netlify build passes on **both** branches. Read the full build log. Fix the cause. Do not hide failures. Local Node 22 builds pass on both branches; the live Netlify log cannot be read without a Netlify token.
- [x] Install dependencies locally with `npm install`. Use Node 22 to match `netlify.toml` (local machine has Node 26). Done with Node 22.23.5 and `npm ci`.

### P1 — Verify the code locally

- [ ] `cp .env.example .env.local` and fill in Supabase URL, publishable key, `NEXT_PUBLIC_SITE_URL` and `ANTHROPIC_API_KEY`. Blocked: needs your real values.
- [x] Run `npm run typecheck && npm run lint && npm test && npm run test:ai && npm run build`. All pass on Node 22.23.5: typecheck clean, lint clean, 12/12 unit, 7/7 AI, production build.
- [x] Run `npm run test:db` against a throwaway local Postgres (`psql`; set `PGHOST` and `PGUSER`). Expect 86 checks to pass. `ERROR` lines are expected and mean a blocked action. Result: 86/86.
- [x] Verify the one-file rebuild: apply `supabase/tests/00_supabase_stubs.sql` + `supabase/migrations/0009_full_rebuild.sql` to a throwaway DB and run all checks in `supabase/tests/`. Then repeat with `0001`–`0008` applied first. Expect 86/86 both times. Result: 86/86 fresh, 86/86 upgrade, 86/86 after simulated damage.
- [x] Confirm the app works with **no** `ANTHROPIC_API_KEY`. Pages must say AI is unavailable. The build passes with no key; the code returns the `not_configured` notice instead of calling the API.

### P2 — Set up the live Supabase project

Project ref from `docs/LAUNCH.md`: `htgrkrlddcsikxvhyogg`. Migrations `0001`–`0003` are already applied.

- [ ] Run `supabase/migrations/0004_creator_flow.sql`, `0005_admin_payouts.sql`, `0006_ai_plans_reports.sql`, `0007_advisor_hardening.sql`, `0008_billing.sql` in that order in the SQL Editor.
- [ ] Delete test accounts: `delete from auth.users where email like 'e2e-%@creatorloop.test';`
- [ ] Auth → URL Configuration: Site URL = live URL; Redirect URLs = `https://<site>/auth/confirm`.
- [ ] Auth → Providers → Email: keep "Confirm email" on.
- [ ] Auth → Attack Protection: turn on CAPTCHA before sharing the link.
- [ ] Auth → Passwords: turn on leaked-password protection if the plan includes it.
- [ ] Emails → SMTP: add Resend/Brevo or similar. The built-in sender allows only a few emails per hour.
- [ ] Turn on multi-factor authentication for the admin account.

### P3 — Set up the live site and test it

- [ ] Connect the repo to Netlify. Add the environment variables listed in section 3.
- [ ] Set `NEXT_PUBLIC_SITE_URL` to the live URL, with no trailing slash. Update Supabase Auth URLs to match.
- [ ] Set a spending limit on the Anthropic API key.
- [ ] Sign up on the live site. Promote the account in SQL: `update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');`
- [ ] Run the 9-step smoke test in `docs/LAUNCH.md` with three browser profiles: admin, business, creator.
- [ ] Run one real AI brief, match, content plan and monthly report. Check the output quality with a real key.

### P4 — Before a wide public launch

- [ ] Have a lawyer read `/terms` and `/privacy`.
- [ ] Confirm prices and FAQ in `src/config/site.ts`.
- [ ] Register for GST if turnover requires it. Invoices here are records, not tax invoices.
- [ ] Decide when a payment gateway is needed. Now, payment is confirmed by hand.
- [ ] Wrap for Google Play with Capacitor once there are paying clients.

## 2. Project readiness checklist

Tick a box only when you have evidence. "N/A" is not the same as done.

### Code and tests

- [ ] Full app runs: business, creator and admin flows (`README.md`, "How a brief moves"). Blocked: needs the live Supabase project and accounts.
- [ ] App works with `NEXT_PUBLIC_LANDING_ONLY` unset. Build passes; browser flow not tested.
- [ ] Waitlist page works with `NEXT_PUBLIC_LANDING_ONLY=1` (`?as=creator` preselects creator). Build passes in this mode; browser check pending.
- [x] `npm run typecheck` passes.
- [x] `npm run lint` passes.
- [x] `npm test` passes (12 unit tests).
- [x] `npm run test:ai` passes (7 checks with the fake Anthropic API).
- [x] `npm run test:db` passes (86 access-rule checks).
- [x] `npm run build` passes on `main` and on `landing` (Node 22.23.5).
- [x] No TEMP or debug code left on any deployed branch. Clean on `landing` (`3f1d44b`); pushed to `origin/landing`.

### Security and data

- [x] Row-level security and triggers are active for all tables. Verified by `test:db` check S4.
- [x] Assignments, payouts, verification and role changes go to the audit trail. Verified by A11 and B10.
- [x] Reels are private; links expire after one hour. Verified in `src/lib/storage.ts` (`createSignedUrls(..., 3600)`).
- [x] Nobody can choose `admin` at signup or change their own role. Verified by T1 and T4.
- [x] Paid payouts and paid/void invoices are locked against edits. Verified by A10 and B9.
- [ ] AI use caps are active per account per day. Table and row rules are tested (H12, H13); the daily count is enforced in app code.
- [ ] All audit reports are read: `docs/security/phase-1-2-audit.md`, `phase-3-audit.md`, `phase-4-audit.md`, `phase-5-audit.md`, `final-review.md`, `launch-audit.md`. Your review, not verifiable by a test.

### Live database and accounts

- [ ] Migrations `0004`–`0008` applied on the live project.
- [ ] Test accounts removed.
- [ ] Admin account promoted and protected by MFA.
- [ ] CAPTCHA, SMTP and leaked-password protection enabled.
- [ ] One full brief loop run on live data: brief → plan → assign → upload → review → close → payout → report.

### Hosting

- [x] Netlify build uses `npm run build` with `@netlify/plugin-nextjs` 5.16.6 pinned. Verified in `netlify.toml` on `main` and on the cleaned `landing` branch.
- [x] No publish directory is set; the adapter sets it. Verified in `netlify.toml`.
- [x] `NODE_VERSION = "22"` set in `netlify.toml`. Verified.
- [ ] All variables from section 3 set on Netlify. Blocked: needs the Netlify dashboard or an auth token.
- [ ] Secrets marked as secret; only named `NEXT_PUBLIC_*` keys exempt from secret scanning.
- [ ] Site URL and Supabase Auth redirect URLs match.
- [ ] Landing branch serves the waitlist; main serves the app.

### Legal and money

- [ ] Prices and FAQ confirmed in `src/config/site.ts`.
- [ ] Terms and Privacy reviewed by a lawyer.
- [ ] Contact email and WhatsApp number correct.
- [ ] UPI ID and payee name correct.
- [ ] GST position checked.
- [ ] Anthropic key has a spending limit.

## 3. How to host

### Supabase (database, auth, storage)

1. Create a project (free tier is fine). Use the ref in `docs/LAUNCH.md` if that project is reused.
2. In **SQL Editor**, run `supabase/migrations/0009_full_rebuild.sql` on its own, or run `0001_*.sql` through `0008_*.sql` in filename order. Do not skip `0007` (advisor hardening) or `0008` (billing). See section 4.
3. In **Authentication → URL Configuration**, set Site URL to the live URL. Add `<site>/auth/confirm` to Redirect URLs.
4. Keep email confirmation on. Add CAPTCHA and your own SMTP before public launch.
5. Get the project URL and **publishable key** from **Project Settings → API**. The publishable key is a client key. Never put a service-role key in a `NEXT_PUBLIC_*` variable.
6. Storage holds reel videos. Rules are in the migrations. Videos are private and served through one-hour signed links.

### Netlify (web app)

1. Connect `atreyakamat/creatorloop`. Choose the branch to deploy:
   - `main` → full app.
   - `landing` → marketing page and waitlist only (`NEXT_PUBLIC_LANDING_ONLY=1`). Use this while the app is closed.
2. Keep `netlify.toml` as it is on `main`:
   - `command = "npm run build"`.
   - `[[plugins]] package = "@netlify/plugin-nextjs"` pinned to 5.16.6.
   - **No** publish directory; the Next.js adapter sets it.
   - `NODE_VERSION = "22"`.
3. Add these environment variables in **Site settings → Environment variables**:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://htgrkrlddcsikxvhyogg.supabase.co` (or your project) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | From Supabase → Project Settings → API |
| `NEXT_PUBLIC_SITE_URL` | Live URL, no trailing slash |
| `ANTHROPIC_API_KEY` | From console.anthropic.com — mark as secret |
| `ANTHROPIC_MODEL` | Optional model override |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Digits with country code, e.g. `91XXXXXXXXXX` |
| `NEXT_PUBLIC_UPI_ID` | Your UPI ID for "Pay by UPI" |
| `NEXT_PUBLIC_UPI_NAME` | Payee name in the UPI app |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Shown on Terms and Privacy |
| `NEXT_PUBLIC_LANDING_ONLY` | `1` on the landing branch only; omit on main |

4. `SECRETS_SCAN_OMIT_KEYS` is already set in `netlify.toml` for the named public keys. Do not add real secrets to that list.
5. Deploy. Read the build log. Run the smoke test from `docs/LAUNCH.md`.
6. The PWA service worker is `public/sw.js` (static assets only). Google Play packaging with Capacitor comes later.

### If the build fails on Netlify

1. Reproduce with `NODE_VERSION=22 npm run build` on your machine.
2. Check the Next.js adapter plugin is installed and pinned.
3. Check that no publish directory is set.
4. Read the Netlify log. Do not add a debug script that posts logs to a public form. Remove such code after use.

## 4. Database engine — manage and rebuild

The engine is the database interface the app calls: 11 tables, 5 enums, 22 triggers on app tables plus the signup trigger on `auth.users`, 30 policies, 14 named indexes plus key constraints, the private `submissions` bucket, and the grants that let the app use it safely.

`supabase/migrations/0009_full_rebuild.sql` is one standalone file with all of it. Use it to recover a project, to start a new one, or to bring a partly migrated database up to date.

- **Run it**: paste the file into the Supabase SQL Editor and run. It is one transaction. Stop if it reports an error and do not publish the site.
- **It is idempotent**: run it on an empty project, on top of `0001`–`0008`, or twice in a row. It drops and recreates triggers and policies so there are no duplicates.
- **It repairs**: missing tables, missing columns added by later migrations, missing constraints, indexes, functions, triggers, policies, the storage bucket and its rules.
- **It does not restore data**: back up first. Lost rows stay lost. A core column dropped by hand needs a backup or a fresh project.
- **Isolation**: the file has no dependency on the other migration files. It does not create a separate Postgres schema, because the Next.js client reads the `public` schema.
- **Keep it in sync**: change this file whenever you change `0001`–`0008`.
- **Verify**: `npm run test:db` must report 86/86. The already-migrated path, the standalone path and the repair path were each checked with 86/86 on PostgreSQL 15.

### Management rules

- Do not give `service_role` or a database password to the browser. Only the publishable key is public.
- Do not edit data in the live SQL Editor without a backup. Money records and the audit log must stay append-only.
- Do not change a guard function without adding a test in `supabase/tests/` first.
- After any database change, run `npm run test:db`, then repeat the smoke test in `docs/LAUNCH.md`.
- Promote an admin with SQL, never through signup. Turn on MFA for that account.
- Keep the Anthropic key server-side and set a spending limit.

### Build record (2026-11-25)

Run with Node 22.23.5 (`mise exec node@22`):

| Check | Result |
| --- | --- |
| `npm ci` | 400 packages installed; 0 production vulnerabilities (`npm audit --omit=dev`) |
| `npm run typecheck` | pass |
| `npm run lint` | pass |
| `npm test` | 12/12 pass |
| `npm run test:ai` | 7/7 pass |
| `npm run test:db` | 86/86 pass |
| `npm run build` on `main` | pass |
| `NEXT_PUBLIC_LANDING_ONLY=1 npm run build` on `landing` | pass |
| Build with no `ANTHROPIC_API_KEY` | pass; AI shows the `not_configured` notice |
| `landing` branch cleanup | commit `3f1d44b`; pushed |
| Live Netlify log | not read: no Netlify token |
| Live Supabase | not touched: no project access |

## 5. Final prompt (ASD-STE100 style)

> You are the readiness assistant for the CreatorLoop project.
>
> Read `TODO.md`. Read `docs/LAUNCH.md`. Read the reports in `docs/security/`.
>
> Check each item in section 2. Mark an item as PASS only when you have proof. Mark an item as FAIL when you have no proof. Give one short reason for each FAIL.
>
> Do each task in section 1 in the given order. Do not skip a task. Do not change a live setting before you ask the user. Do not write a secret to a file. Do not leave debug code in the repo.
>
> Use `main` for the full app. Use `landing` for the waitlist page. Check the build on each branch before you report PASS.
>
> Write your report with short sentences. Use one instruction per sentence. Use active voice. Use the same words for the same thing every time. Do not use vague words.
>
> At the end, write these four lines:
>
> - Ready to launch: YES or NO
> - Open P0 tasks: <number>
> - Open P1 tasks: <number>
> - Next action: <one short instruction>
>
> If the answer is NO, do not publish the site.
