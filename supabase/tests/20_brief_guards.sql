\set ON_ERROR_STOP 0
-- Runs after 10_rls.sql (same database, same seed users).
-- Sending a brief needs a plan (0008); give the seed businesses one.
update public.businesses set plan = 'growth', reels_per_month = 8;
set role authenticated;

-- Business A on its own brief
select set_config('request.jwt.claim.sub','aaaaaaaa-0000-0000-0000-000000000001',false);
update public.briefs set assigned_creator_id = 'cccccccc-0000-0000-0000-000000000002' where id = 'eeeeeeee-0000-0000-0000-00000000000a';
select 'G1 bizA self-assign blocked, creator still -> ' || right(assigned_creator_id::text, 1) || ' (expect 1)' from public.briefs where id = 'eeeeeeee-0000-0000-0000-00000000000a';

insert into public.briefs (id, business_id, title, status, ai_generations, assigned_creator_id)
values ('eeeeeeee-0000-0000-0000-00000000000c','bbbbbbbb-0000-0000-0000-00000000000a','New', 'completed', 99, 'cccccccc-0000-0000-0000-000000000001');
select 'G2 new brief forced clean -> ' || status || '/' || ai_generations || '/' || coalesce(assigned_creator_id::text,'none') || ' (expect draft/0/none)'
  from public.briefs where id = 'eeeeeeee-0000-0000-0000-00000000000c';

update public.briefs set ai_generations = 1 where id = 'eeeeeeee-0000-0000-0000-00000000000c';
update public.briefs set ai_generations = 0 where id = 'eeeeeeee-0000-0000-0000-00000000000c';
select 'G3 AI counter cannot go down -> ' || ai_generations || ' (expect 1)' from public.briefs where id = 'eeeeeeee-0000-0000-0000-00000000000c';

update public.briefs set status = 'open' where id = 'eeeeeeee-0000-0000-0000-00000000000c';
update public.briefs set status = 'approved' where id = 'eeeeeeee-0000-0000-0000-00000000000c';
select 'G4 draft->open ok, open->approved blocked -> ' || status || ' (expect open)' from public.briefs where id = 'eeeeeeee-0000-0000-0000-00000000000c';

update public.businesses set about = 'Goan breakfasts', audience = 'Tourists and locals', price_range = 'mid' where owner_id = 'aaaaaaaa-0000-0000-0000-000000000001';
select 'G5 bizA edits own business details -> ' || coalesce(price_range,'null') || ' (expect mid)' from public.businesses where owner_id = 'aaaaaaaa-0000-0000-0000-000000000001';

-- Admin can assign and move status freely
select set_config('request.jwt.claim.sub','dddddddd-0000-0000-0000-000000000001',false);
update public.briefs set assigned_creator_id = 'cccccccc-0000-0000-0000-000000000002', status = 'assigned' where id = 'eeeeeeee-0000-0000-0000-00000000000c';
select 'G6 admin assigns -> ' || status || '/' || right(assigned_creator_id::text, 1) || ' (expect assigned/2)' from public.briefs where id = 'eeeeeeee-0000-0000-0000-00000000000c';
