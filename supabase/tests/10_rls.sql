\set ON_ERROR_STOP 0
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select, insert on storage.objects to authenticated;

insert into auth.users (id, email, raw_user_meta_data) values
 ('aaaaaaaa-0000-0000-0000-000000000001','a@x.com','{"role":"business","full_name":"Biz A"}'),
 ('aaaaaaaa-0000-0000-0000-000000000002','b@x.com','{"role":"business","full_name":"Biz B"}'),
 ('cccccccc-0000-0000-0000-000000000001','c@x.com','{"role":"creator","full_name":"Creator C"}'),
 ('cccccccc-0000-0000-0000-000000000002','e@x.com','{"role":"creator","full_name":"Creator E"}'),
 ('dddddddd-0000-0000-0000-000000000001','d@x.com','{"role":"admin","full_name":"Sneaky"}');

select 'T1 admin-at-signup blocked -> ' || role from public.profiles where id='dddddddd-0000-0000-0000-000000000001';
select 'T1b creator_profiles auto rows -> ' || count(*) from public.creator_profiles;

-- seed (as superuser)
insert into public.businesses (id, owner_id, name, category) values
 ('bbbbbbbb-0000-0000-0000-00000000000a','aaaaaaaa-0000-0000-0000-000000000001','Cafe A','cafe'),
 ('bbbbbbbb-0000-0000-0000-00000000000b','aaaaaaaa-0000-0000-0000-000000000002','Cafe B','cafe');
insert into public.briefs (id, business_id, title, assigned_creator_id, status) values
 ('eeeeeeee-0000-0000-0000-00000000000a','bbbbbbbb-0000-0000-0000-00000000000a','Brief A','cccccccc-0000-0000-0000-000000000001','assigned');
update public.profiles set role='admin' where id='dddddddd-0000-0000-0000-000000000001';

set role authenticated;

-- Business A
select set_config('request.jwt.claim.sub','aaaaaaaa-0000-0000-0000-000000000001',false);
select 'T2 bizA sees businesses -> ' || count(*) || ' (expect 1)' from public.businesses;
select 'T3 bizA sees profiles -> ' || count(*) || ' (expect 1)' from public.profiles;
update public.profiles set role='admin' where id='aaaaaaaa-0000-0000-0000-000000000001';
select 'T4 bizA role after escalation attempt -> ' || role from public.profiles where id='aaaaaaaa-0000-0000-0000-000000000001';
insert into public.businesses (owner_id, name, category) values ('aaaaaaaa-0000-0000-0000-000000000002','Hijack','cafe');
select 'T5 bizA briefs visible -> ' || count(*) || ' (expect 1)' from public.briefs;

-- Business B
select set_config('request.jwt.claim.sub','aaaaaaaa-0000-0000-0000-000000000002',false);
select 'T6 bizB sees Brief A -> ' || count(*) || ' (expect 0)' from public.briefs;
insert into public.briefs (business_id, title) values ('bbbbbbbb-0000-0000-0000-00000000000a','sneaky brief');

-- Creator C (assigned)
select set_config('request.jwt.claim.sub','cccccccc-0000-0000-0000-000000000001',false);
select 'T7 creatorC sees briefs -> ' || count(*) || ' (expect 1)' from public.briefs;
select 'T8 creatorC sees only the business behind their brief -> ' || count(*) || ' (expect 1)' from public.businesses;
insert into public.businesses (owner_id, name, category) values ('cccccccc-0000-0000-0000-000000000001','Creator biz','cafe');
insert into public.submissions (brief_id, creator_id, video_path) values ('eeeeeeee-0000-0000-0000-00000000000a','cccccccc-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-00000000000a/v.mp4');
select 'T9 creatorC submission saved -> ' || count(*) || ' (expect 1)' from public.submissions;
insert into public.payouts (creator_id, amount_inr) values ('cccccccc-0000-0000-0000-000000000001', 99999);
insert into storage.objects (bucket_id, name) values ('submissions','cccccccc-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-00000000000a/v.mp4');
insert into storage.objects (bucket_id, name) values ('submissions','cccccccc-0000-0000-0000-000000000002/eeeeeeee-0000-0000-0000-00000000000a/x.mp4');

-- Creator E (not assigned)
select set_config('request.jwt.claim.sub','cccccccc-0000-0000-0000-000000000002',false);
select 'T10 creatorE sees briefs -> ' || count(*) || ' (expect 0)' from public.briefs;
insert into public.submissions (brief_id, creator_id, video_path) values ('eeeeeeee-0000-0000-0000-00000000000a','cccccccc-0000-0000-0000-000000000002','x');
select 'T11 creatorE sees storage objects -> ' || count(*) || ' (expect 0)' from storage.objects;

-- Business A sees the submission + file for its brief
select set_config('request.jwt.claim.sub','aaaaaaaa-0000-0000-0000-000000000001',false);
select 'T12 bizA sees submissions -> ' || count(*) || ' (expect 1)' from public.submissions;
select 'T13 bizA sees storage objects -> ' || count(*) || ' (expect 1)' from storage.objects;

-- Admin
select set_config('request.jwt.claim.sub','dddddddd-0000-0000-0000-000000000001',false);
select 'T14 admin sees businesses/profiles/briefs -> ' || (select count(*) from public.businesses) || '/' || (select count(*) from public.profiles) || '/' || (select count(*) from public.briefs) || ' (expect 2/5/1)';
insert into public.payouts (creator_id, amount_inr) values ('cccccccc-0000-0000-0000-000000000001', 1500);
select 'T15 admin payout rows -> ' || count(*) || ' (expect 1)' from public.payouts;

-- Anonymous
select set_config('request.jwt.claim.sub','',false);
select 'T16 anon sees creators/briefs -> ' || (select count(*) from public.creator_profiles) || '/' || (select count(*) from public.briefs) || ' (expect 0/0)';
