# Security audit: Phases 1–2 (auth, database, landing, onboarding, AI briefs)

Date: 11 Nov 2026 · Scope: everything on `main` up to commit `eaa60d1` · Method: manual review of every route, server action, SQL policy and trigger, plus `npm audit`, then a regression test for each fix.

## Summary

| # | Finding | Severity | Status |
| --- | --- | --- | --- |
| A1 | Creators could mark themselves "verified" | High | Fixed, tested (H1) |
| A2 | Submissions could be inserted pre-approved or pointing at another creator's file; businesses could rewrite any submission column | High | Fixed, tested (H3, H4, H6) |
| A3 | Briefs could be edited or deleted after a creator started work; businesses could set the budget | Medium | Fixed, tested (H7, H8, H9) |
| A4 | Video uploads were not tied to an assigned brief and had no size or type limit | Medium | Fixed, tested (H5, H14) |
| A5 | AI cost cap was per business, and one account could create many businesses | Medium | Fixed, tested (H10, H12, H13) |
| A6 | Open redirect after login via `/\evil.com` or tab characters in `next` | Medium | Fixed, unit-tested |
| A7 | No size limits at the database for free text (forms had limits, the API did not) | Low | Fixed, tested (H11) |
| A8 | Prompt injection: owner text could close the prompt's data tags | Low | Fixed, unit-tested |
| A9 | Missing security headers (clickjacking, MIME sniffing, HSTS) | Low | Fixed |
| A10 | Signup echoed raw provider error messages | Low | Fixed |
| A11 | Dependencies | Info | `npm audit`: 0 known vulnerabilities |

## Details

**A1.** The `creator_profiles` update policy let a creator change any column on their own row, including `is_verified`. A trigger now rejects that change unless the caller is an admin.

**A2.** Row-level security checked *who* could insert or update a submission but not *what*. A creator could insert a row with `status = 'approved'`, or with a `video_path` in another creator's folder. A business could change `video_path` or `creator_id` on review. Insert now forces `pending`, requires the path to be `<own id>/<brief id>/…`, and caps uploads at 30 per brief. Review can only change `status` and `feedback`, and only once.

**A3.** A business could change a brief's content, reel count or budget after a creator was assigned, or delete a brief (and, by cascade, the creator's submissions). Content is now editable only in draft, budget is admin-only, and businesses can delete only draft or cancelled briefs. Businesses can no longer delete their own business row (admin only).

**A4.** Any creator could upload any file type of any size into their own folder. Uploads now require the folder's brief to be assigned to that creator and in progress; the bucket accepts only MP4, MOV and WebM up to 50 MB. There are no update or delete policies on stored files, so uploads cannot be overwritten.

**A5.** Limits were 4 AI writes per brief and 10 briefs a day per business, but nothing stopped one account creating many businesses through the API. There is now one business per account and an `ai_usage` ledger with a per-account daily cap (30 brief writes). Ledger rows can be added only for yourself and never changed or removed.

**A6.** `next` was checked for a leading `/` and against `//`, but browsers treat `\` as `/` and strip tabs and newlines, so `/\evil.com` left the site. One shared `safeRedirectPath` helper now rejects backslashes and control characters. It is used by login, the email-confirmation route and the login form.

**A8.** Owner answers are wrapped in `<business>` and `<answers>` tags and the model is told to treat them as data. Angle brackets are now stripped from that text so it cannot close the tags. AI output is schema-validated and rendered as plain text (React escapes it), so it cannot inject markup.

**A9.** Added `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, HSTS, a restrictive `Permissions-Policy`, and a CSP limiting framing, `base-uri`, `form-action` and plugins. `X-Powered-By` is off.

## Checked and found sound

- Admin cannot be chosen at signup; users cannot change their own role (T1, T4).
- Each business sees only its own data; creators see only assigned briefs; anonymous users see nothing (T2–T16).
- Sessions are verified with `getClaims()` (signature check), not the unverified cookie payload.
- Every server action re-checks the session and ownership; nothing trusts hidden form fields.
- The service worker caches only static files, never signed-in pages.
- No secrets in the repo; `.env*` is ignored except `.env.example`.

## Accepted for now (do in the Supabase dashboard)

- **CAPTCHA and rate limits on signup/login** are Supabase Auth settings. Turn on CAPTCHA before public launch.
- **Leaked-password protection** and **email confirmation** should be on in Auth settings.
- **Full script CSP with nonces** is future hardening; current CSP covers framing and form targets.
