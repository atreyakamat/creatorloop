\set ON_ERROR_STOP 0
-- Checks for 0006_ai_plans_reports.sql. Brief D (business B): reel 1 changes_requested, reels 2–3 approved.
grant select, insert, update, delete on all tables in schema public to authenticated;
set role authenticated;

select set_config('request.jwt.claim.sub','aaaaaaaa-0000-0000-0000-000000000002',false);
update public.submissions set views = 1200, likes = 90 where id = 'ffffffff-0000-0000-0000-000000000002';
update public.submissions set views = 5 where id = 'ffffffff-0000-0000-0000-000000000001';
update public.submissions set views = -4 where id = 'ffffffff-0000-0000-0000-000000000003';
select 'R1 results only on approved reels, never negative -> ' || string_agg(coalesce(views::text,'none'), '/' order by id) || ' (expect none/1200/none)'
  from public.submissions where brief_id = 'eeeeeeee-0000-0000-0000-00000000000d';

insert into public.ai_documents (business_id, kind, period, content) values ('bbbbbbbb-0000-0000-0000-00000000000b','calendar','2026-11-01','{"a":1}');
insert into public.ai_documents (business_id, kind, period, content) values ('bbbbbbbb-0000-0000-0000-00000000000b','calendar','2026-11-01','{"a":2}');
insert into public.ai_documents (business_id, kind, period, content) values ('bbbbbbbb-0000-0000-0000-00000000000a','report','2026-11-01','{"a":3}');
insert into public.ai_documents (business_id, kind, period, content) values ('bbbbbbbb-0000-0000-0000-00000000000b','report','2026-11-15','{"a":4}');
update public.ai_documents set content = '{"a":5}' where business_id = 'bbbbbbbb-0000-0000-0000-00000000000b';
select 'R2 one plan per month, own business only -> ' || count(*) || '/' || max(content ->> 'a') || ' (expect 1/5)' from public.ai_documents;

select set_config('request.jwt.claim.sub','aaaaaaaa-0000-0000-0000-000000000001',false);
update public.submissions set views = 999 where id = 'ffffffff-0000-0000-0000-000000000002';
select 'R3 other business cannot read plans or log results -> ' || (select count(*) from public.ai_documents) || '/' || (select count(*) from public.submissions where views = 999) || ' (expect 0/0)';

select set_config('request.jwt.claim.sub','cccccccc-0000-0000-0000-000000000001',false);
update public.submissions set views = 777777 where id = 'ffffffff-0000-0000-0000-000000000002';
select 'R4 creator cannot inflate results or read plans -> ' || (select views from public.submissions where id = 'ffffffff-0000-0000-0000-000000000002') || '/' || (select count(*) from public.ai_documents) || ' (expect 1200/0)';
