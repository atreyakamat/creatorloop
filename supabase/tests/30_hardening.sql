\set ON_ERROR_STOP 0
-- Checks for 0003_security_hardening.sql. Runs after 10 and 20.
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage on all sequences in schema public to authenticated;
set role authenticated;

-- Creator C
select set_config('request.jwt.claim.sub','cccccccc-0000-0000-0000-000000000001',false);
update public.creator_profiles set is_verified = true where id = 'cccccccc-0000-0000-0000-000000000001';
select 'H1 creator self-verify blocked -> ' || is_verified || ' (expect false)' from public.creator_profiles where id = 'cccccccc-0000-0000-0000-000000000001';
update public.creator_profiles set bio = 'Food reels' where id = 'cccccccc-0000-0000-0000-000000000001';
select 'H2 creator edits own bio -> ' || bio || ' (expect Food reels)' from public.creator_profiles where id = 'cccccccc-0000-0000-0000-000000000001';

insert into public.submissions (brief_id, creator_id, video_path, status, feedback)
values ('eeeeeeee-0000-0000-0000-00000000000a','cccccccc-0000-0000-0000-000000000001',
        'cccccccc-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-00000000000a/second.mp4','approved','self-approved');
select 'H3 pre-approved insert forced pending -> ' || status || '/' || coalesce(feedback,'none') || ' (expect pending/none)'
  from public.submissions where video_path like '%second.mp4';
insert into public.submissions (brief_id, creator_id, video_path)
values ('eeeeeeee-0000-0000-0000-00000000000a','cccccccc-0000-0000-0000-000000000001',
        'cccccccc-0000-0000-0000-000000000002/eeeeeeee-0000-0000-0000-00000000000a/stolen.mp4');
select 'H4 foreign video path rejected -> ' || count(*) || ' (expect 0)' from public.submissions where video_path like '%stolen.mp4';
insert into storage.objects (bucket_id, name) values ('submissions','cccccccc-0000-0000-0000-000000000001/eeeeeeee-0000-0000-0000-00000000000c/x.mp4');
select 'H5 upload for a brief not assigned to me -> ' || count(*) || ' (expect 0)' from storage.objects where name like '%00000000000c/x.mp4';

-- Business A
select set_config('request.jwt.claim.sub','aaaaaaaa-0000-0000-0000-000000000001',false);
update public.submissions set video_path = 'x', creator_id = 'cccccccc-0000-0000-0000-000000000002' where video_path like '%second.mp4';
update public.submissions set status = 'approved' where video_path like '%second.mp4';
update public.submissions set status = 'changes_requested' where video_path like '%second.mp4';
select 'H6 business review: path locked, approve once -> ' || status || '/' || right(creator_id::text,1) || ' (expect approved/1)'
  from public.submissions where video_path like '%second.mp4';
update public.briefs set title = 'Edited after assignment' where id = 'eeeeeeee-0000-0000-0000-00000000000a';
update public.briefs set budget_inr = 1 where id = 'eeeeeeee-0000-0000-0000-00000000000a';
select 'H7 assigned brief content locked -> ' || title || '/' || coalesce(budget_inr::text,'none') || ' (expect Brief A/none)' from public.briefs where id = 'eeeeeeee-0000-0000-0000-00000000000a';
delete from public.briefs where id = 'eeeeeeee-0000-0000-0000-00000000000a';
select 'H8 brief with work cannot be deleted -> ' || count(*) || ' (expect 1)' from public.briefs where id = 'eeeeeeee-0000-0000-0000-00000000000a';
delete from public.businesses where id = 'bbbbbbbb-0000-0000-0000-00000000000a';
select 'H9 business cannot delete itself -> ' || count(*) || ' (expect 1)' from public.businesses where id = 'bbbbbbbb-0000-0000-0000-00000000000a';
insert into public.businesses (owner_id, name, category) values ('aaaaaaaa-0000-0000-0000-000000000001','Second','cafe');
select 'H10 one business per account -> ' || count(*) || ' (expect 1)' from public.businesses;
update public.businesses set about = repeat('x', 5000) where id = 'bbbbbbbb-0000-0000-0000-00000000000a';
select 'H11 oversized text rejected -> ' || char_length(about) || ' (expect 15)' from public.businesses where id = 'bbbbbbbb-0000-0000-0000-00000000000a';

insert into public.ai_usage (user_id, kind) values ('aaaaaaaa-0000-0000-0000-000000000001','brief');
insert into public.ai_usage (user_id, kind) values ('aaaaaaaa-0000-0000-0000-000000000002','brief');
delete from public.ai_usage;
update public.ai_usage set created_at = now() - interval '2 days';
select 'H12 ai_usage: own insert only, no delete/backdate -> ' || count(*) || '/' || count(*) filter (where created_at > now() - interval '1 day') || ' (expect 1/1)' from public.ai_usage;
select set_config('request.jwt.claim.sub','aaaaaaaa-0000-0000-0000-000000000002',false);
select 'H13 ai_usage hidden from others -> ' || count(*) || ' (expect 0)' from public.ai_usage;

reset role;
select 'H14 bucket limits -> ' || file_size_limit || '/' || array_length(allowed_mime_types,1) || ' (expect 52428800/3)' from storage.buckets where id = 'submissions';
