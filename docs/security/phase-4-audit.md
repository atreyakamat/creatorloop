# Security audit: Phase 4 (admin panel, assignment, payouts)

Date: 11 Nov 2026 · Scope: migration `0005`, `src/app/admin/**`, `src/lib/admin.ts` · Method: manual review of every admin action and query, with a database test per finding.

## Summary

| # | Finding | Severity | Status |
| --- | --- | --- | --- |
| D1 | Paid payouts could still be edited or deleted | Medium | Fixed, tested (A10) |
| D2 | No record of who assigned, paid, verified or changed a role | Medium | Fixed: append-only audit trail, tested (A11–A13) |
| D3 | Closing a brief and creating its payout were two separate writes | Low | Fixed: one database transaction (`admin_close_brief`), tested (A3, A4) |
| D4 | Non-admins calling admin functions directly | Checked | Refused (A1) |
| D5 | Paying the same brief twice | Checked | Not possible (A4) |
| D6 | Creators or businesses reading other people's payouts | Checked | Not possible (A6–A8) |
| D7 | Links in creator profiles shown to admins | Checked | Only `http(s)` links render, with `rel="noopener noreferrer nofollow"` |

## Details

**D1.** Once a payout is marked paid it is locked. The app (any role, including admin) cannot change its amount or delete it. Corrections need a new payout or a change in the Supabase SQL editor, which leaves its own trace.

**D2.** `audit_log` records brief status and assignment changes, budget changes, payout creation and payment, creator verification, and role changes, each with who did it and when. Rows are written only by database triggers. No account can insert, edit or delete them through the app, and only admins can read them.

**D3.** `admin_close_brief` checks the caller is an admin, checks the brief is approved, creates the payout and completes the brief together. If anything fails, nothing changes.

## How admin access is enforced

1. Every admin page and action calls `requireRole("admin")` on the server.
2. The database then checks again: rows open only if `is_admin()` is true for the session. A non-admin who calls an admin action directly gets redirected, and if they hit the database API they get zero rows.
3. Admin cannot be chosen at signup and cannot be granted from inside the app. It is granted once, by you, in the Supabase SQL editor. Role changes are logged.
4. Server actions accept only same-origin requests (built into Next.js), which blocks cross-site request forgery.

## Accepted for now

- **The admin account is the key to everything.** Use a strong, unique password and turn on multi-factor authentication for it in Supabase Auth. Requiring MFA for admin inside the app is the next hardening step.
- **CreatorLoop tracks payouts but does not move money.** You pay creators yourself (UPI or bank) and mark the payout paid. No payment credentials are stored.
- **Admins see owner and creator phone numbers** so they can coordinate on WhatsApp. Nobody else can.
