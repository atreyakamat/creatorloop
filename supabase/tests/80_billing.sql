\set ON_ERROR_STOP 0
-- Checks for 0008_billing.sql.
grant select, insert, update, delete on all tables in schema public to authenticated;
insert into public.briefs (id, business_id, title, deliverables) values
 ('eeeeeeee-0000-0000-0000-0000000000b1','bbbbbbbb-0000-0000-0000-00000000000a','Plan test 1', 3),
 ('eeeeeeee-0000-0000-0000-0000000000b2','bbbbbbbb-0000-0000-0000-00000000000a','Plan test 2', 2);
update public.businesses set plan = 'none', reels_per_month = 0 where id = 'bbbbbbbb-0000-0000-0000-00000000000a';
set role authenticated;

-- Business A, no plan
select set_config('request.jwt.claim.sub','aaaaaaaa-0000-0000-0000-000000000001',false);
update public.briefs set status = 'open' where id = 'eeeeeeee-0000-0000-0000-0000000000b1';
select 'B1 no plan: brief cannot be sent -> ' || status || ' (expect draft)' from public.briefs where id = 'eeeeeeee-0000-0000-0000-0000000000b1';
update public.businesses set plan = 'growth', reels_per_month = 99 where id = 'bbbbbbbb-0000-0000-0000-00000000000a';
select 'B2 business cannot give itself a plan -> ' || plan || '/' || reels_per_month || ' (expect none/0)' from public.businesses where id = 'bbbbbbbb-0000-0000-0000-00000000000a';

-- Admin activates Starter (4 reels)
select set_config('request.jwt.claim.sub','dddddddd-0000-0000-0000-000000000001',false);
update public.businesses set plan = 'starter', reels_per_month = 4 where id = 'bbbbbbbb-0000-0000-0000-00000000000a';
insert into public.invoices (id, business_id, period, amount_inr) values ('11111111-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-00000000000a', date_trunc('month', now())::date, 6999);
insert into public.invoices (business_id, period, amount_inr) values ('bbbbbbbb-0000-0000-0000-00000000000a', date_trunc('month', now())::date, 6999);
select 'B3 one live invoice per business per month -> ' || count(*) || ' (expect 1)' from public.invoices;

-- Business A with a plan
select set_config('request.jwt.claim.sub','aaaaaaaa-0000-0000-0000-000000000001',false);
update public.briefs set status = 'open' where id = 'eeeeeeee-0000-0000-0000-0000000000b1';
update public.briefs set status = 'open' where id = 'eeeeeeee-0000-0000-0000-0000000000b2';
select 'B4 allowance of 4: 3-reel brief sent, 2-reel brief refused -> ' || string_agg(status::text, '/' order by id) || ' (expect open/draft)' from public.briefs where title like 'Plan test%';
update public.briefs set opened_at = now() - interval '2 months' where id = 'eeeeeeee-0000-0000-0000-0000000000b1';
select 'B5 business cannot backdate a brief to free up allowance -> ' || (opened_at > now() - interval '1 day') || ' (expect true)' from public.briefs where id = 'eeeeeeee-0000-0000-0000-0000000000b1';
update public.briefs set status = 'cancelled' where id = 'eeeeeeee-0000-0000-0000-0000000000b1';
update public.briefs set status = 'open' where id = 'eeeeeeee-0000-0000-0000-0000000000b2';
select 'B6 cancelling before work starts frees the allowance -> ' || status || ' (expect open)' from public.briefs where id = 'eeeeeeee-0000-0000-0000-0000000000b2';
update public.invoices set status = 'paid', paid_at = now(), amount_inr = 1;
insert into public.invoices (business_id, period, amount_inr, status, paid_at) values ('bbbbbbbb-0000-0000-0000-00000000000a', '2026-01-01', 0, 'paid', now());
select 'B7 business sees its invoice, cannot mark it paid or forge one -> ' || count(*) || '/' || max(status::text) || '/' || max(amount_inr) || ' (expect 1/due/6999)' from public.invoices;
select set_config('request.jwt.claim.sub','aaaaaaaa-0000-0000-0000-000000000002',false);
select 'B8 other business sees no invoices -> ' || count(*) || ' (expect 0)' from public.invoices;

-- Admin marks paid; then it is locked
select set_config('request.jwt.claim.sub','dddddddd-0000-0000-0000-000000000001',false);
update public.invoices set status = 'paid', paid_at = now() where id = '11111111-0000-0000-0000-000000000001';
update public.invoices set amount_inr = 1 where id = '11111111-0000-0000-0000-000000000001';
delete from public.invoices where id = '11111111-0000-0000-0000-000000000001';
select 'B9 paid invoice is locked -> ' || status || '/' || amount_inr || ' (expect paid/6999)' from public.invoices where id = '11111111-0000-0000-0000-000000000001';
select 'B10 audit trail has plan change and invoice events -> ' ||
  (select count(*) from public.audit_log where action = 'plan_changed' and detail ->> 'to' = 'starter') || '/' ||
  (select count(*) from public.audit_log where action = 'invoice_created') || '/' ||
  (select count(*) from public.audit_log where action = 'invoice_paid') || ' (expect 1/1/1)';
