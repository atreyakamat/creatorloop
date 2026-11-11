-- CreatorLoop — security hardening from the Phase 1–2 audit (docs/security/phase-1-2-audit.md).

-- ── A1. Creators could set is_verified on their own profile ────────────────
create or replace function public.guard_creator_profile_update()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    if new.is_verified is distinct from old.is_verified then
      raise exception 'Only an admin can verify creators';
    end if;
  end if;
  return new;
end $$;

create trigger creator_profiles_update_guard
  before update on public.creator_profiles
  for each row execute function public.guard_creator_profile_update();

-- ── A2. Submissions: creators could insert pre-approved rows or point at
--        someone else's file; businesses could rewrite any column ───────────
create or replace function public.guard_submission_insert()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    new.status := 'pending';
    new.feedback := null;
    if new.video_path not like (auth.uid()::text || '/' || new.brief_id::text || '/%')
       or position('..' in new.video_path) > 0 then
      raise exception 'Invalid video path';
    end if;
    if (select count(*) from public.submissions s where s.brief_id = new.brief_id) >= 30 then
      raise exception 'Too many uploads for this brief';
    end if;
  end if;
  return new;
end $$;

create trigger submissions_insert_guard
  before insert on public.submissions
  for each row execute function public.guard_submission_insert();

create or replace function public.guard_submission_update()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    if (new.brief_id, new.creator_id, new.video_path, new.created_at)
         is distinct from (old.brief_id, old.creator_id, old.video_path, old.created_at)
       or new.caption is distinct from old.caption then
      raise exception 'Only the review status and feedback can be changed';
    end if;
    if new.status is distinct from old.status and old.status <> 'pending' then
      raise exception 'This reel has already been reviewed';
    end if;
  end if;
  return new;
end $$;

create trigger submissions_update_guard
  before update on public.submissions
  for each row execute function public.guard_submission_update();

-- ── A3. Briefs: content could be edited after a creator was assigned;
--        budget is admin-only; briefs with work attached could be deleted ───
create or replace function public.guard_brief_update()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user not in ('authenticated', 'anon') or public.is_admin() then
    return new;
  end if;

  if new.assigned_creator_id is distinct from old.assigned_creator_id then
    raise exception 'Only an admin can assign creators';
  end if;

  if new.business_id is distinct from old.business_id then
    raise exception 'A brief cannot move to another business';
  end if;

  if new.budget_inr is distinct from old.budget_inr then
    raise exception 'Only an admin can set the budget';
  end if;

  if new.ai_generations < old.ai_generations then
    raise exception 'AI usage cannot be reset';
  end if;

  if old.status <> 'draft'
     and (new.title, new.goal, new.deliverables, new.due_date, new.ai_generations)
           is distinct from (old.title, old.goal, old.deliverables, old.due_date, old.ai_generations) then
    raise exception 'A brief can only be edited while it is a draft';
  end if;

  if old.status <> 'draft'
     and (new.answers is distinct from old.answers or new.ai_brief is distinct from old.ai_brief) then
    raise exception 'A brief can only be edited while it is a draft';
  end if;

  if new.status is distinct from old.status
     and not (old.status in ('draft', 'open') and new.status in ('draft', 'open', 'cancelled')) then
    raise exception 'Brief status % → % is not allowed', old.status, new.status;
  end if;

  return new;
end $$;

create or replace function public.guard_brief_insert()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    new.status := 'draft';
    new.assigned_creator_id := null;
    new.ai_generations := 0;
    new.budget_inr := null;
  end if;
  return new;
end $$;

drop policy "briefs: business or admin delete" on public.briefs;
create policy "briefs: business deletes drafts, admin any" on public.briefs
  for delete using (
    (public.owns_business(business_id) and status in ('draft', 'cancelled'))
    or public.is_admin()
  );

drop policy "businesses: owner or admin delete" on public.businesses;
create policy "businesses: admin delete" on public.businesses
  for delete using (public.is_admin());

-- One business per account (keeps per-business limits meaningful).
create unique index businesses_one_per_owner on public.businesses (owner_id);

-- ── A4. Storage: uploads were not tied to an assigned brief and had no
--        size or type limits ───────────────────────────────────────────────
update storage.buckets
   set file_size_limit = 52428800,  -- 50 MB
       allowed_mime_types = array['video/mp4', 'video/quicktime', 'video/webm']
 where id = 'submissions';

drop policy "submissions bucket: creator uploads own folder" on storage.objects;
create policy "submissions bucket: creator uploads for assigned brief" on storage.objects
  for insert with check (
    bucket_id = 'submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.briefs b
      where b.id::text = (storage.foldername(name))[2]
        and b.assigned_creator_id = auth.uid()
        and b.status in ('assigned', 'in_review')
    )
  );

-- ── A5. AI cost control per account (not just per brief or per business) ───
create table public.ai_usage (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  kind        text not null check (kind in ('brief', 'match', 'calendar', 'report')),
  created_at  timestamptz not null default now()
);
create index ai_usage_user_day_idx on public.ai_usage (user_id, created_at desc);

alter table public.ai_usage enable row level security;
create policy "ai_usage: read own or admin" on public.ai_usage
  for select using (user_id = auth.uid() or public.is_admin());
-- Insert only for yourself, never update or delete: usage can only go up.
create policy "ai_usage: insert own" on public.ai_usage
  for insert with check (user_id = auth.uid());

-- ── A6. Size limits on free-text columns (API callers bypass form limits) ──
alter table public.profiles
  add constraint profiles_full_name_len check (char_length(full_name) <= 120),
  add constraint profiles_phone_len     check (phone is null or char_length(phone) <= 20),
  add constraint profiles_city_len      check (char_length(city) <= 60);

alter table public.businesses
  add constraint businesses_name_len      check (char_length(name) between 1 and 80),
  add constraint businesses_category_len  check (char_length(category) <= 40),
  add constraint businesses_area_len      check (area is null or char_length(area) <= 60),
  add constraint businesses_instagram_len check (instagram is null or char_length(instagram) <= 60),
  add constraint businesses_website_len   check (website is null or char_length(website) <= 200),
  add constraint businesses_about_len     check (about is null or char_length(about) <= 400),
  add constraint businesses_audience_len  check (audience is null or char_length(audience) <= 300);

alter table public.creator_profiles
  add constraint creators_bio_len        check (bio is null or char_length(bio) <= 600),
  add constraint creators_instagram_len  check (instagram is null or char_length(instagram) <= 60),
  add constraint creators_niches_len     check (coalesce(array_length(niches, 1), 0) <= 8),
  add constraint creators_portfolio_len  check (coalesce(array_length(portfolio_urls, 1), 0) <= 5);

alter table public.briefs
  add constraint briefs_title_len    check (char_length(title) between 1 and 200),
  add constraint briefs_goal_len     check (goal is null or char_length(goal) <= 40),
  add constraint briefs_answers_len  check (octet_length(answers::text) <= 10000),
  add constraint briefs_ai_brief_len check (ai_brief is null or octet_length(ai_brief::text) <= 40000),
  add constraint briefs_deliverables_max check (deliverables <= 8);

alter table public.submissions
  add constraint submissions_path_len     check (char_length(video_path) <= 300),
  add constraint submissions_caption_len  check (caption is null or char_length(caption) <= 2200),
  add constraint submissions_feedback_len check (feedback is null or char_length(feedback) <= 1000);

-- Signup metadata is user-controlled: trim it so oversized values can't break signup.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  requested text := new.raw_user_meta_data ->> 'role';
  chosen public.user_role := case when requested = 'creator' then 'creator' else 'business' end;
begin
  insert into public.profiles (id, role, full_name, phone)
  values (
    new.id,
    chosen,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120),
    left(new.raw_user_meta_data ->> 'phone', 20)
  );
  if chosen = 'creator' then
    insert into public.creator_profiles (id) values (new.id);
  end if;
  return new;
end $$;
