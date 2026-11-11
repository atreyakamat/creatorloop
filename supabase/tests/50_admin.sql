\set ON_ERROR_STOP 0
-- Checks for 0005_admin_payouts.sql. Brief D (business B, creator C) is approved.
grant select, insert, update, delete on all tables in schema public to authenticated;
set role authenticated;

select set_config('request.jwt.claim.sub','aaaaaaaa-0000-0000-0000-000000000002',false);
select public.admin_close_brief('eeeeeeee-0000-0000-0000-00000000000d', 999999, 'self-pay');
select set_config('request.jwt.claim.sub','cccccccc-0000-0000-0000-000000000001',false);
select public.admin_close_brief('eeeeeeee-0000-0000-0000-00000000000d', 999999, 'self-pay');
select 'A1 non-admins cannot close or pay a brief -> ' || count(*) || ' (expect 0)' from public.payouts where brief_id = 'eeeeeeee-0000-0000-0000-00000000000d';

select set_config('request.jwt.claim.sub','dddddddd-0000-0000-0000-000000000001',false);
select public.admin_close_brief('eeeeeeee-0000-0000-0000-00000000000c', 100, null);
select 'A2 cannot close a brief that is not approved -> ' || status || ' (expect assigned)' from public.briefs where id = 'eeeeeeee-0000-0000-0000-00000000000c';
select public.admin_close_brief('eeeeeeee-0000-0000-0000-00000000000d', 3000, 'Two reels') is not null as closed \gset
select 'A3 admin closes approved brief -> ' || b.status || '/' || p.amount_inr || '/' || p.status || ' (expect completed/3000/pending)'
  from public.briefs b join public.payouts p on p.brief_id = b.id where b.id = 'eeeeeeee-0000-0000-0000-00000000000d';
select public.admin_close_brief('eeeeeeee-0000-0000-0000-00000000000d', 3000, 'again');
insert into public.payouts (creator_id, brief_id, amount_inr) values ('cccccccc-0000-0000-0000-000000000001','eeeeeeee-0000-0000-0000-00000000000d', 3000);
select 'A4 a brief is paid out once -> ' || count(*) || ' (expect 1)' from public.payouts where brief_id = 'eeeeeeee-0000-0000-0000-00000000000d';
update public.payouts set status = 'paid' where brief_id = 'eeeeeeee-0000-0000-0000-00000000000d';
update public.payouts set status = 'paid', paid_at = now() where brief_id = 'eeeeeeee-0000-0000-0000-00000000000d';
select 'A5 paid needs a paid date -> ' || status || '/' || (paid_at is not null) || ' (expect paid/true)' from public.payouts where brief_id = 'eeeeeeee-0000-0000-0000-00000000000d';

select set_config('request.jwt.claim.sub','cccccccc-0000-0000-0000-000000000001',false);
update public.payouts set amount_inr = 9999999;
select 'A6 creator sees own payouts, cannot edit -> ' || count(*) || '/' || max(amount_inr) || ' (expect 2/3000)' from public.payouts;
select set_config('request.jwt.claim.sub','cccccccc-0000-0000-0000-000000000002',false);
select 'A7 other creator sees none -> ' || count(*) || ' (expect 0)' from public.payouts;
select set_config('request.jwt.claim.sub','aaaaaaaa-0000-0000-0000-000000000002',false);
select 'A8 business cannot see payouts -> ' || count(*) || ' (expect 0)' from public.payouts;
update public.briefs set status = 'open' where id = 'eeeeeeee-0000-0000-0000-00000000000d';
select 'A9 completed brief cannot be reopened by business -> ' || status || ' (expect completed)' from public.briefs where id = 'eeeeeeee-0000-0000-0000-00000000000d';

-- Paid payouts are locked, even for admins using the app
select set_config('request.jwt.claim.sub','dddddddd-0000-0000-0000-000000000001',false);
update public.payouts set amount_inr = 1 where brief_id = 'eeeeeeee-0000-0000-0000-00000000000d';
delete from public.payouts where brief_id = 'eeeeeeee-0000-0000-0000-00000000000d';
select 'A10 paid payout cannot be edited or deleted -> ' || count(*) || '/' || max(amount_inr) || ' (expect 1/3000)' from public.payouts where brief_id = 'eeeeeeee-0000-0000-0000-00000000000d';
update public.creator_profiles set is_verified = true where id = 'cccccccc-0000-0000-0000-000000000001';
select 'A11 audit trail records close, payout, paid, verify -> ' ||
  (select count(*) from public.audit_log where action = 'brief_completed') || '/' ||
  (select count(*) from public.audit_log where action = 'payout_created' and detail ->> 'brief_id' = 'eeeeeeee-0000-0000-0000-00000000000d' and actor = 'dddddddd-0000-0000-0000-000000000001') || '/' ||
  (select count(*) from public.audit_log where action = 'payout_paid') || '/' ||
  (select count(*) from public.audit_log where action = 'creator_verified') || ' (expect 1/1/1/1)';
insert into public.audit_log (action, entity) values ('forged', 'x');
delete from public.audit_log;
update public.audit_log set action = 'edited';
select 'A12 audit trail is append-only, even for admins -> ' || count(*) filter (where action in ('forged','edited')) || '/' || (count(*) > 5) || ' (expect 0/true)' from public.audit_log;
select set_config('request.jwt.claim.sub','aaaaaaaa-0000-0000-0000-000000000002',false);
select 'A13 audit trail hidden from non-admins -> ' || count(*) || ' (expect 0)' from public.audit_log;
