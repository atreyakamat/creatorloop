-- CreatorLoop — Phase 3: creator profiles, open briefs, applications, deliveries.

-- Public-facing creator name (profiles.full_name stays private with the phone number).
alter table public.creator_profiles
  add column display_name text not null default '' check (char_length(display_name) <= 60);

update public.creator_profiles c
   set display_name = left(p.full_name, 60)
  from public.profiles p
 where p.id = c.id;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  requested text := new.raw_user_meta_data ->> 'role';
  chosen public.user_role := case when requested = 'creator' then 'creator' else 'business' end;
  full_name text := left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120);
begin
  insert into public.profiles (id, role, full_name, phone)
  values (new.id, chosen, full_name, left(new.raw_user_meta_data ->> 'phone', 20));
  if chosen = 'creator' then
    insert into public.creator_profiles (id, display_name) values (new.id, left(full_name, 60));
  end if;
  return new;
end $$;

-- ── Open briefs are visible to creators ─────────────────────────────────────
create policy "briefs: creators read open" on public.briefs
  for select using (status = 'open' and public.my_role() = 'creator');

-- Creators can see the business behind a brief they can see (name, area, type).
create or replace function public.creator_can_see_business(b_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.briefs b
    where b.business_id = b_id
      and (
        b.assigned_creator_id = auth.uid()
        or (b.status = 'open' and public.my_role() = 'creator')
      )
  )
$$;

create policy "businesses: creators with a visible brief" on public.businesses
  for select using (public.creator_can_see_business(id));

-- ── Applications ────────────────────────────────────────────────────────────
create table public.brief_applications (
  id          uuid primary key default gen_random_uuid(),
  brief_id    uuid not null references public.briefs (id) on delete cascade,
  creator_id  uuid not null references public.creator_profiles (id) on delete cascade,
  note        text check (note is null or char_length(note) <= 500),
  created_at  timestamptz not null default now(),
  unique (brief_id, creator_id)
);
create index brief_applications_creator_idx on public.brief_applications (creator_id);

alter table public.brief_applications enable row level security;

create policy "applications: creator or admin read" on public.brief_applications
  for select using (creator_id = auth.uid() or public.is_admin());

create policy "applications: creator applies to open brief" on public.brief_applications
  for insert with check (
    creator_id = auth.uid()
    and public.my_role() = 'creator'
    and exists (select 1 from public.briefs b where b.id = brief_id and b.status = 'open')
  );

create policy "applications: creator withdraws, admin removes" on public.brief_applications
  for delete using (creator_id = auth.uid() or public.is_admin());

-- ── Deliveries ──────────────────────────────────────────────────────────────
-- Uploads only while the brief is in progress.
drop policy "submissions: assigned creator insert" on public.submissions;
create policy "submissions: assigned creator insert" on public.submissions
  for insert with check (
    creator_id = auth.uid()
    and exists (
      select 1 from public.briefs b
      where b.id = brief_id
        and b.assigned_creator_id = auth.uid()
        and b.status in ('assigned', 'in_review')
    )
  );

-- Brief status follows the deliveries:
--   any reel waiting for review        → in_review
--   enough reels approved              → approved
--   otherwise (waiting on the creator) → assigned
-- Runs as the table owner so it can move status past the business-side guard.
create or replace function public.sync_brief_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  b public.briefs%rowtype;
  n_pending integer;
  n_approved integer;
  next_status public.brief_status;
begin
  select * into b from public.briefs where id = new.brief_id for update;
  if b.status not in ('assigned', 'in_review', 'approved') then
    return new;
  end if;

  select count(*) filter (where status = 'pending'),
         count(*) filter (where status = 'approved')
    into n_pending, n_approved
    from public.submissions
   where brief_id = new.brief_id;

  next_status := case
    when n_approved >= b.deliverables then 'approved'
    when n_pending > 0 then 'in_review'
    else 'assigned'
  end;

  if next_status is distinct from b.status then
    update public.briefs set status = next_status where id = b.id;
  end if;
  return new;
end $$;

create trigger submissions_sync_brief_status
  after insert or update of status on public.submissions
  for each row execute function public.sync_brief_status();

revoke execute on function public.sync_brief_status() from public, anon, authenticated;

-- ── Hardening found in the Phase 3 audit (docs/security/phase-3-audit.md) ───

-- B1. Creator profiles (rates, follower counts, Instagram) were readable by every
--     signed-in account. Now: the creator, admins, and a business only for the
--     creator assigned to one of its briefs.
create or replace function public.works_with_creator(c_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
      from public.briefs b
      join public.businesses bz on bz.id = b.business_id
     where b.assigned_creator_id = c_id
       and bz.owner_id = auth.uid()
  )
$$;

drop policy "creators: signed-in read" on public.creator_profiles;
create policy "creators: self, admin, or their client" on public.creator_profiles
  for select using (id = auth.uid() or public.is_admin() or public.works_with_creator(id));

-- B2. Links and handles are rendered in the admin and business views: only allow
--     http(s) links and plain Instagram handles at the database, whatever the client sends.
create or replace function public.all_http_urls(urls text[])
returns boolean language sql immutable as $$
  select coalesce(bool_and(u ~* '^https?://[^[:space:]]+$' and char_length(u) <= 300), true)
    from unnest(urls) as u
$$;

alter table public.creator_profiles
  add constraint creators_portfolio_http check (public.all_http_urls(portfolio_urls)),
  add constraint creators_instagram_fmt  check (instagram is null or instagram ~ '^[A-Za-z0-9._]{1,30}$');

alter table public.businesses
  add constraint businesses_instagram_fmt check (instagram is null or instagram ~ '^[A-Za-z0-9._]{1,30}$'),
  add constraint businesses_website_http  check (website is null or website ~* '^https?://[^[:space:]]+$');

-- B3. The "complete your profile before applying" rule lived only in the app.
drop policy "applications: creator applies to open brief" on public.brief_applications;
create policy "applications: complete profile applies to open brief" on public.brief_applications
  for insert with check (
    creator_id = auth.uid()
    and public.my_role() = 'creator'
    and exists (select 1 from public.briefs b where b.id = brief_id and b.status = 'open')
    and exists (
      select 1 from public.creator_profiles c
       where c.id = auth.uid()
         and c.display_name <> ''
         and c.bio is not null
         and c.instagram is not null
         and coalesce(array_length(c.niches, 1), 0) > 0
    )
  );
