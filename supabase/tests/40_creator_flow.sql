\set ON_ERROR_STOP 0
-- Checks for 0004_creator_flow.sql. State from earlier files: brief A (business A) has
-- creator C's reels; brief C (business A) was assigned to creator E by the admin.
grant select, insert, update, delete on all tables in schema public to authenticated;

select 'C1 brief A followed its approved reel -> ' || status || ' (expect approved)' from public.briefs where id = 'eeeeeeee-0000-0000-0000-00000000000a';

-- A fresh open brief for business B
insert into public.briefs (id, business_id, title, status, deliverables)
values ('eeeeeeee-0000-0000-0000-00000000000d','bbbbbbbb-0000-0000-0000-00000000000b','Open brief B','open', 2);

set role authenticated;

-- Creator C browses and applies
select set_config('request.jwt.claim.sub','cccccccc-0000-0000-0000-000000000001',false);
select 'C2 creator sees open brief -> ' || count(*) || ' (expect 1)' from public.briefs where status = 'open';
select 'C3 creator sees business of open brief only by name -> ' || string_agg(name, ',' order by name) || ' (expect Cafe A,Cafe B)' from public.businesses;
insert into public.brief_applications (brief_id, creator_id) values ('eeeeeeee-0000-0000-0000-00000000000d','cccccccc-0000-0000-0000-000000000001');
select 'C3b incomplete profile cannot apply -> ' || count(*) || ' (expect 0)' from public.brief_applications;
update public.creator_profiles set portfolio_urls = array['javascript:alert(1)'] where id = 'cccccccc-0000-0000-0000-000000000001';
update public.creator_profiles set instagram = '"><script>' where id = 'cccccccc-0000-0000-0000-000000000001';
update public.creator_profiles set display_name = 'Creator C', instagram = 'c.reels', niches = array['Food'], portfolio_urls = array['https://instagram.com/reel/abc'] where id = 'cccccccc-0000-0000-0000-000000000001';
select 'C3c only http links and plain handles stored -> ' || instagram || '/' || portfolio_urls[1] || ' (expect c.reels/https://instagram.com/reel/abc)' from public.creator_profiles where id = 'cccccccc-0000-0000-0000-000000000001';
select 'C3d creators cannot browse other creators -> ' || count(*) || ' (expect 1)' from public.creator_profiles;
insert into public.brief_applications (brief_id, creator_id, note) values ('eeeeeeee-0000-0000-0000-00000000000d','cccccccc-0000-0000-0000-000000000001','I shoot cafes');
insert into public.brief_applications (brief_id, creator_id) values ('eeeeeeee-0000-0000-0000-00000000000d','cccccccc-0000-0000-0000-000000000001');
insert into public.brief_applications (brief_id, creator_id) values ('eeeeeeee-0000-0000-0000-00000000000d','cccccccc-0000-0000-0000-000000000002');
insert into public.brief_applications (brief_id, creator_id) values ('eeeeeeee-0000-0000-0000-00000000000a','cccccccc-0000-0000-0000-000000000001');
select 'C4 applied once, only as self, only to open -> ' || count(*) || ' (expect 1)' from public.brief_applications;
insert into public.submissions (brief_id, creator_id, video_path) values ('eeeeeeee-0000-0000-0000-00000000000d','cccccccc-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-00000000000d/early.mp4');
select 'C5 cannot deliver before being assigned -> ' || count(*) || ' (expect 0)' from public.submissions where brief_id = 'eeeeeeee-0000-0000-0000-00000000000d';
insert into public.submissions (brief_id, creator_id, video_path) values ('eeeeeeee-0000-0000-0000-00000000000a','cccccccc-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-00000000000a/late.mp4');
select 'C6 cannot deliver after brief is approved -> ' || count(*) || ' (expect 0)' from public.submissions where video_path like '%late.mp4';

-- Creator E cannot see C's application; business B cannot see applications (admin matches)
select set_config('request.jwt.claim.sub','cccccccc-0000-0000-0000-000000000002',false);
select 'C7 other creator sees applications -> ' || count(*) || ' (expect 0)' from public.brief_applications;
select set_config('request.jwt.claim.sub','aaaaaaaa-0000-0000-0000-000000000002',false);
select 'C8 business sees applications -> ' || count(*) || ' (expect 0)' from public.brief_applications;
insert into public.brief_applications (brief_id, creator_id) values ('eeeeeeee-0000-0000-0000-00000000000d','aaaaaaaa-0000-0000-0000-000000000002');
select 'C9 business cannot browse creators before one is assigned -> ' || count(*) || ' (expect 0)' from public.creator_profiles;

-- Admin assigns creator C to brief D
select set_config('request.jwt.claim.sub','dddddddd-0000-0000-0000-000000000001',false);
select 'C10 admin sees applications -> ' || count(*) || ' (expect 1)' from public.brief_applications;
update public.briefs set assigned_creator_id = 'cccccccc-0000-0000-0000-000000000001', status = 'assigned' where id = 'eeeeeeee-0000-0000-0000-00000000000d';

-- Creator C delivers two reels; status follows
select set_config('request.jwt.claim.sub','cccccccc-0000-0000-0000-000000000001',false);
insert into public.submissions (id, brief_id, creator_id, video_path) values
 ('ffffffff-0000-0000-0000-000000000001','eeeeeeee-0000-0000-0000-00000000000d','cccccccc-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-00000000000d/r1.mp4');
select 'C11 delivery moves brief to review -> ' || status || ' (expect in_review)' from public.briefs where id = 'eeeeeeee-0000-0000-0000-00000000000d';
update public.briefs set status = 'approved' where id = 'eeeeeeee-0000-0000-0000-00000000000d';
update public.submissions set status = 'approved' where id = 'ffffffff-0000-0000-0000-000000000001';
select 'C12 creator cannot approve own reel -> ' || status || ' (expect pending)' from public.submissions where id = 'ffffffff-0000-0000-0000-000000000001';

-- Business B reviews
select set_config('request.jwt.claim.sub','aaaaaaaa-0000-0000-0000-000000000002',false);
update public.submissions set status = 'changes_requested', feedback = 'Brighter please' where id = 'ffffffff-0000-0000-0000-000000000001';
select 'C12b business sees only its assigned creator -> ' || string_agg(display_name, ',') || ' (expect Creator C)' from public.creator_profiles;
select 'C13 changes requested sends brief back -> ' || status || ' (expect assigned)' from public.briefs where id = 'eeeeeeee-0000-0000-0000-00000000000d';

select set_config('request.jwt.claim.sub','cccccccc-0000-0000-0000-000000000001',false);
insert into public.submissions (id, brief_id, creator_id, video_path) values
 ('ffffffff-0000-0000-0000-000000000002','eeeeeeee-0000-0000-0000-00000000000d','cccccccc-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-00000000000d/r2.mp4'),
 ('ffffffff-0000-0000-0000-000000000003','eeeeeeee-0000-0000-0000-00000000000d','cccccccc-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-00000000000d/r3.mp4');
select set_config('request.jwt.claim.sub','aaaaaaaa-0000-0000-0000-000000000002',false);
update public.submissions set status = 'approved' where id = 'ffffffff-0000-0000-0000-000000000002';
select 'C14 one of two approved keeps reviewing -> ' || status || ' (expect in_review)' from public.briefs where id = 'eeeeeeee-0000-0000-0000-00000000000d';
update public.submissions set status = 'approved' where id = 'ffffffff-0000-0000-0000-000000000003';
select 'C15 all reels approved -> ' || status || ' (expect approved)' from public.briefs where id = 'eeeeeeee-0000-0000-0000-00000000000d';

-- Business A cannot review business B's reels
select set_config('request.jwt.claim.sub','aaaaaaaa-0000-0000-0000-000000000001',false);
select 'C16 other business sees these reels -> ' || count(*) || ' (expect 0)' from public.submissions where brief_id = 'eeeeeeee-0000-0000-0000-00000000000d';
