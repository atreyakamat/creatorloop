# Final review: live test and Supabase advisor

Date: 11 Nov 2026 · Scope: the whole app at the end of Phase 5.

## Live test against a real Supabase project

Project `creatorloop` (Mumbai region). At the time of the test only migrations `0001` and `0002` were applied there, so this run covers sign-in, sessions, onboarding, briefs and tenant isolation. The later flows are covered by the database tests and still need one live pass (see "Still to run live").

16 of 16 browser checks passed:

- Signed-out visits to `/business` and `/admin` go to login.
- A wrong password shows a generic error.
- `?next=/\evil.example` after login stays inside the app.
- `/dashboard` sends a business to `/business`; a business cannot open `/admin` or `/creator`.
- Business profile saves; HTML in the name is shown as text, not run; an Instagram URL is reduced to the handle.
- A brief saves as a draft with its answers; when AI is unavailable the page says so instead of failing.
- A second business gets "not found" for the first business's brief.
- An account that asked for `admin` at signup is an ordinary business.
- Logging out ends the session.
- Security headers are present on responses.

### Bug found and fixed by this test

Every signed-in page logged a Next.js error (`Date.now()` during prerender, raised inside the Supabase client). Pages still rendered, but prefetching was failing and the server log filled with errors. The server-side Supabase client now marks itself as request-time work (`await connection()`); the log is clean.

## Supabase security advisor

| Finding | Action |
| --- | --- |
| `set_updated_at` had no pinned search path | Fixed in `0007` (also `all_http_urls`); test S3 checks every function |
| Signed-out callers could execute `is_admin`, `my_role`, `owns_business`, `handle_new_user` through the API | Fixed in `0007`: revoked from signed-out callers; trigger functions revoked from everyone (S1, S2) |
| Signed-in users can execute `is_admin`, `my_role`, `owns_business` | Intended: row-level security calls them, and they only answer about the caller |
| Leaked-password protection is off | Dashboard setting: turn it on under Auth → Passwords if your plan includes it |

## AI calls

`npm run test:ai` runs all four generators against a local stand-in for the Anthropic API: 7 of 7 checks pass (request shape, typed parsing, tag stripping, out-of-list picks dropped, no creator names sent). No real AI call has been made yet because there is no API key in this environment, so output quality is untested.

## Still to run live

1. Apply migrations `0003`–`0007` to the Supabase project.
2. One pass of the full loop on the live project: creator profile → apply → admin assigns → upload a real video → business reviews → admin closes and pays → report.
3. One real AI brief, plan, report and match with `ANTHROPIC_API_KEY` set.
4. Remove the three `e2e-…@creatorloop.test` accounts created for the live test.

## Test totals

- Database access rules: 76 checks (`npm run test:db`)
- Unit tests: 12 (`npm test`)
- AI generators against a stand-in: 7 (`npm run test:ai`)
- Live browser checks: 16
