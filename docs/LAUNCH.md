# Launch checklist

Everything here is a one-time step. Do them in order.

## 1. Database (5 min)

Supabase project `creatorloop` already has migrations 0001–0003. In the Supabase dashboard open **SQL Editor** and run, in order, the files `0004` to `0008` from `supabase/migrations/`. Then remove the test accounts:

```sql
delete from auth.users where email like 'e2e-%@creatorloop.test';
```

## 2. Auth settings (3 min)

Supabase → **Authentication**:

- **URL Configuration**: Site URL = your live URL. Redirect URLs: add `https://<your-site>/auth/confirm`.
- **Sign In / Providers → Email**: keep "Confirm email" on.
- **Attack Protection**: turn on CAPTCHA before sharing the link publicly.
- **Emails → SMTP**: the built-in sender only allows a few emails an hour. Add your own SMTP (Resend, Brevo or similar) before inviting more than a handful of people.

## 3. Netlify (5 min)

Add new site → import `atreyakamat/creatorloop`. Then **Site configuration → Environment variables**:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://htgrkrlddcsikxvhyogg.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API keys → publishable key |
| `NEXT_PUBLIC_SITE_URL` | your live URL, no trailing slash |
| `ANTHROPIC_API_KEY` | from console.anthropic.com (mark as secret) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | digits with country code, e.g. `91XXXXXXXXXX` |
| `NEXT_PUBLIC_UPI_ID` | your UPI ID, for the "Pay by UPI" button |
| `NEXT_PUBLIC_UPI_NAME` | payee name shown in the UPI app |
| `NEXT_PUBLIC_CONTACT_EMAIL` | shown on Terms and Privacy |

Deploy. Set a spending limit on the Anthropic key.

## 4. Make yourself admin (1 min)

Sign up on the live site, confirm your email, then in the SQL Editor:

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

Turn on multi-factor authentication for that account.

## 5. Smoke test (10 min)

Use three browsers or profiles: admin, a business, a creator.

1. Business: sign up, add the business, write a brief. Sending it should ask for a plan.
2. Admin: Businesses → open it → set Starter (4 reels) → create this month's invoice.
3. Business: Billing shows the invoice and Pay by UPI. Send the brief to creators.
4. Creator: sign up, complete the profile, apply to the brief.
5. Admin: Briefs → assign the creator and set their pay.
6. Creator: upload a short MP4.
7. Business: approve the reel (repeat until all reels are approved).
8. Admin: close the brief, then mark the payout and the invoice paid.
9. Business: Report → log views → write the summary. Content plan → write a plan.

If every step works, you are live.

## 6. Before a wide public launch

- Have a lawyer read `/terms` and `/privacy`.
- Confirm prices in `src/config/site.ts`.
- Register for GST if and when your turnover requires it; invoices here are simple records, not tax invoices.
