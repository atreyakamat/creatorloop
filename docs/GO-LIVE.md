# CreatorLoop — go-live runbook

Last updated: 2026-11-25.
Use this file when you decide to launch. It records what is verified, what is still open, and the exact order of work.
Companion files: [TODO.md](../TODO.md) · [LAUNCH.md](LAUNCH.md) · [security reports](security/).

## 1. Current state

| Item | State |
| --- | --- |
| Full app branch | `main` at `72462a3` |
| Waitlist-only branch | `landing` at `3f1d44b` (no TEMP debug code) |
| Local build | pass on both branches, Node 22.23.5 |
| Unit tests | 12/12 pass |
| AI tests | 7/7 pass against the local stand-in |
| Database tests | 86/86 pass |
| One-file rebuild | 86/86 on fresh, upgrade and repair paths |
| Netlify site | not connected; `creatorloop-avus.netlify.app` returns 404 |
| Live Supabase | not touched; migrations `0004`–`0008` may still be pending |
| Real AI call | not tested; no live key was used |
| Three-browser smoke test | not run |
| Ready to launch | **NO** |

The code is ready. The remaining work is account setup, secrets and one live test pass.

## 2. What I need from you

Give me these only when you want me to finish the deployment. Do not paste secrets into a chat message if you can avoid it; put them in Netlify, or set a token in the environment.

| Item | Where to get it | Used for |
| --- | --- | --- |
| Netlify access | Invite me to the Netlify team, or set `NETLIFY_AUTH_TOKEN` | Read the build log, set env vars, deploy |
| Live URL | Chosen during Netlify site creation | `NEXT_PUBLIC_SITE_URL`, Supabase redirects |
| Supabase project ref | Supabase dashboard URL | Database and auth setup |
| Supabase publishable key | Project Settings → API keys | Netlify env var |
| Anthropic API key | console.anthropic.com | AI briefs, matching, plans, reports |
| WhatsApp number | Your business number | Landing-page contact |
| UPI ID and payee name | Your payment details | Invoice "Pay by UPI" button |
| Contact email | Your support address | Terms and Privacy pages |
| Admin signup email | The address you will sign up with | Admin promotion SQL |
| Branch choice | `main` for the full app, `landing` for waitlist only | Netlify deploy branch |

## 3. Go-live order

Do these in order. Do not skip a step. Stop if a step fails.

### Step 0 — Choose the mode

- Full app: deploy `main`.
- Waitlist first: deploy `landing` with `NEXT_PUBLIC_LANDING_ONLY=1`. App routes redirect to the waitlist.

### Step 1 — Database

1. Open the Supabase project → **SQL Editor**.
2. Run `supabase/migrations/0009_full_rebuild.sql` on its own.
   - It creates or repairs the whole interface.
   - It is idempotent. It is safe on top of `0001`–`0008`.
   - It runs as one transaction. On error, nothing is committed.
3. Delete test accounts:
   ```sql
   delete from auth.users where email like 'e2e-%@creatorloop.test';
   ```
4. Back up before you change data. The rebuild restores structure, not rows.

### Step 2 — Auth

1. **Authentication → URL Configuration**
   - Site URL: `https://<your-site>.netlify.app`
   - Redirect URLs: add `https://<your-site>.netlify.app/auth/confirm`
2. **Providers → Email**: keep "Confirm email" on.
3. **Attack Protection**: turn on CAPTCHA before you share the link.
4. **Passwords**: turn on leaked-password protection if your plan includes it.
5. **Emails → SMTP**: add Resend, Brevo or similar. The built-in sender allows only a few emails per hour.

### Step 3 — Netlify

1. **app.netlify.com → Add new site → Import an existing project → GitHub → `atreyakamat/creatorloop`**.
2. Select the branch: `main` for the full app, `landing` for the waitlist.
3. Keep the build command `npm run build`. Do not set a publish directory.
4. Add the environment variables:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://htgrkrlddcsikxvhyogg.supabase.co` (or your project) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key |
| `NEXT_PUBLIC_SITE_URL` | `https://<your-site>.netlify.app`, no trailing slash |
| `ANTHROPIC_API_KEY` | Mark as secret |
| `ANTHROPIC_MODEL` | Optional |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Digits with country code |
| `NEXT_PUBLIC_UPI_ID` | Your UPI ID |
| `NEXT_PUBLIC_UPI_NAME` | Payee name |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Contact address |
| `NEXT_PUBLIC_LANDING_ONLY` | `1` on `landing` only; leave unset on `main` |

5. Deploy. Read the full build log.
6. If `NEXT_PUBLIC_SITE_URL` was not known before the first build, set it and redeploy.

### Step 4 — Admin account

1. Sign up on the live site and confirm the email.
2. Run this in the SQL Editor:
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'you@example.com');
   ```
3. Turn on MFA for that account.

### Step 5 — Smoke test

Use three browser profiles: admin, business, creator.

1. Business: sign up, add the business, write a brief. Sending should ask for a plan.
2. Admin: Businesses → set Starter (4 reels) → create this month's invoice.
3. Business: Billing shows the invoice and Pay by UPI. Send the brief.
4. Creator: sign up, complete the profile, apply to the brief.
5. Admin: Briefs → assign the creator and set their pay.
6. Creator: upload a short MP4.
7. Business: approve the reel. Repeat until all reels are approved.
8. Admin: close the brief, then mark the payout and invoice paid.
9. Business: Report → log views → write the summary. Content Plan → write a plan.

### Step 6 — Real AI pass

1. Set a spending limit on the Anthropic key.
2. Run one brief, one match, one content plan and one monthly report.
3. Check that output quality is acceptable and that no invented prices, hours or offers appear.

## 4. If something breaks

### Netlify build fails

1. Reproduce with Node 22:
   ```bash
   mise exec node@22 -- npm ci
   mise exec node@22 -- npm run build
   ```
2. Check `@netlify/plugin-nextjs` is 5.16.6 and `netlify.toml` uses `npm run build`.
3. Check no publish directory is set.
4. Read the Netlify log. Do not add a debug script that posts logs to a public form.

### Database is damaged

1. Run `supabase/migrations/0009_full_rebuild.sql` again.
2. It restores tables, later columns, constraints, indexes, functions, triggers, policies, the storage bucket and grants.
3. It does not restore data. Use a Supabase backup for rows.
4. Run `npm run test:db`. Expect 86/86.

### You need the waitlist instead

1. Deploy the `landing` branch.
2. Set `NEXT_PUBLIC_LANDING_ONLY=1`.
3. App routes redirect to `/#waitlist`.
4. Remove the flag when the app opens.

## 5. Verification record

Run with `mise exec node@22`:

| Command | Result |
| --- | --- |
| `npm ci` | 400 packages; 0 production vulnerabilities |
| `npm run typecheck` | pass |
| `npm run lint` | pass |
| `npm test` | 12/12 |
| `npm run test:ai` | 7/7 |
| `npm run test:db` | 86/86 |
| `npm run build` | pass on `main` |
| `NEXT_PUBLIC_LANDING_ONLY=1 npm run build` | pass on `landing` |
| Build with no `ANTHROPIC_API_KEY` | pass; AI shows the `not_configured` notice |

The rebuild file was also checked on PostgreSQL 15 in three ways: standalone (86/86), on top of `0001`–`0008` (86/86), and after deliberate damage to a column, constraint, policy, trigger, function and bucket (repaired, 86/86).

## 6. When you are ready

Send this message, filled in:

> CreatorLoop go-live.
> Branch: main.
> Live URL: https://__________.netlify.app
> Netlify: I invited you / token is in the environment.
> Supabase: migrations are applied / please apply them.
> Admin email: __________
> Everything else is set in Netlify and Supabase.

Then I will:

1. Confirm the live build log and the deployed routes.
2. Re-run the readiness checklist with evidence.
3. Report PASS or FAIL for each item.
4. Tell you the next action.

I cannot finish the live steps without access to Netlify and Supabase. Local work is complete and pushed.

## 7. Readiness summary

Done: code, local builds, unit tests, AI stand-in tests, database tests, one-file rebuild, landing-branch cleanup, docs.

Open: live build log, Supabase migrations and auth settings, Netlify site and env vars, admin promotion, three-browser smoke test, real AI pass, legal review, GST decision.

**Ready to launch: NO** until the open items have evidence.
