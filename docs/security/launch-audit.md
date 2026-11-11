# Security audit: launch work (plans, invoices, password reset, public pages)

Date: 11 Nov 2026 · Scope: migration `0008`, billing pages, admin plan and invoice controls, password reset, Terms and Privacy pages.

## Summary

| # | Finding | Severity | Status |
| --- | --- | --- | --- |
| F1 | A business could give itself a plan or a bigger allowance through the API | High | Blocked in the database, tested (B2) |
| F2 | A business could send briefs without a plan, or beyond its monthly allowance | High | Enforced in the database, tested (B1, B4) |
| F3 | A business could backdate a brief to free up allowance | Medium | Blocked, tested (B5) |
| F4 | A business could mark its own invoice paid or create a fake paid invoice | High | Not possible: invoices are admin-write only, tested (B7) |
| F5 | Paid or voided invoices could be edited or deleted | Medium | Locked for everyone using the app, tested (B9) |
| F6 | Plan changes and invoices were not in the audit trail | Medium | Added, tested (B10) |
| F7 | Password reset could reveal which emails have accounts | Low | Same reply either way |
| F8 | Reset page reachable without the emailed link | Checked | Requires a signed-in session, which only the link (or a normal login) provides |
| F9 | UPI pay link built from configuration | Low | UPI ID format is validated; amount and note come from the invoice, never from the browser |

## How money is handled

CreatorLoop does not move money and stores no card, bank or UPI credentials. An admin creates an invoice; the business sees it with a "Pay by UPI" button that opens their own UPI app with the amount filled in; the admin marks it paid when the money arrives. Payouts to creators work the same way in reverse. Every step is written to the audit trail.

## Accepted for now

- **Payment is confirmed by hand.** Someone could claim to have paid when they have not; the admin checks the bank before marking an invoice paid. A payment gateway with automatic confirmation is the next step once volume justifies it.
- **Terms and Privacy pages are plain-language drafts**, not reviewed by a lawyer.
- **Allowance counts reels requested in briefs sent this month.** Cancelling a brief before a creator delivers frees it up again.
