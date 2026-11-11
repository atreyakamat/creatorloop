-- CreatorLoop — Phase 1 schema
-- Roles: business (pays), creator (makes content), admin (runs the loop).
-- Admin is never self-assigned at signup; promote with:
--   update public.profiles set role = 'admin' where id = '<user-uuid>';

create extension if not exists "pgcrypto";

-- ───────────────────────── Enums ─────────────────────────
create type public.user_role as enum ('business', 'creator', 'admin');

create type public.brief_status as enum (
  'draft', 'open', 'assigned', 'in_review', 'approved', 'completed', 'cancelled'
);

create type public.submission_status as enum (
  'pending', 'changes_requested', 'approved'
);

create type public.payout_status as enum ('pending', 'paid');

-- ───────────────────────── Tables ─────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        public.user_role not null default 'business',
  full_name   text not null default '',
  phone       text,
  city        text not null default 'Goa',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.businesses (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles (id) on delete cascade,
  name        text not null,
  category    text not null,              -- café, restaurant, hotel, boutique…
  area        text,                       -- Panjim, Mapusa, Assagao…
  instagram   text,
  website     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index businesses_owner_idx on public.businesses (owner_id);

create table public.creator_profiles (
  id              uuid primary key references public.profiles (id) on delete cascade,
  bio             text,
  niches          text[] not null default '{}',   -- food, travel, fashion…
  instagram       text,
  followers       integer check (followers is null or followers >= 0),
  portfolio_urls  text[] not null default '{}',
  rate_per_reel   integer check (rate_per_reel is null or rate_per_reel >= 0), -- INR
  is_verified     boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.briefs (
  id                   uuid primary key default gen_random_uuid(),
  business_id          uuid not null references public.businesses (id) on delete cascade,
  title                text not null,
  goal                 text,                       -- footfall, launch, bookings…
  answers              jsonb not null default '{}', -- owner's questionnaire answers
  ai_brief             jsonb,                       -- generated shot list, hooks, captions
  deliverables         integer not null default 1 check (deliverables > 0),
  budget_inr           integer check (budget_inr is null or budget_inr >= 0),
  status               public.brief_status not null default 'draft',
  assigned_creator_id  uuid references public.creator_profiles (id) on delete set null,
  due_date             date,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index briefs_business_idx on public.briefs (business_id);
create index briefs_creator_idx  on public.briefs (assigned_creator_id);
create index briefs_status_idx   on public.briefs (status);

create table public.submissions (
  id          uuid primary key default gen_random_uuid(),
  brief_id    uuid not null references public.briefs (id) on delete cascade,
  creator_id  uuid not null references public.creator_profiles (id) on delete cascade,
  video_path  text not null,                 -- storage path in the "submissions" bucket
  caption     text,
  status      public.submission_status not null default 'pending',
  feedback    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index submissions_brief_idx   on public.submissions (brief_id);
create index submissions_creator_idx on public.submissions (creator_id);

create table public.payouts (
  id          uuid primary key default gen_random_uuid(),
  creator_id  uuid not null references public.creator_profiles (id) on delete cascade,
  brief_id    uuid references public.briefs (id) on delete set null,
  amount_inr  integer not null check (amount_inr >= 0),
  status      public.payout_status not null default 'pending',
  paid_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index payouts_creator_idx on public.payouts (creator_id);

-- ───────────────────────── Helpers ─────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger profiles_updated_at         before update on public.profiles         for each row execute function public.set_updated_at();
create trigger businesses_updated_at       before update on public.businesses       for each row execute function public.set_updated_at();
create trigger creator_profiles_updated_at before update on public.creator_profiles for each row execute function public.set_updated_at();
create trigger briefs_updated_at           before update on public.briefs           for each row execute function public.set_updated_at();
create trigger submissions_updated_at      before update on public.submissions      for each row execute function public.set_updated_at();

-- Role lookup that bypasses RLS (avoids recursive policy checks).
create or replace function public.my_role()
returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.owns_business(b_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.businesses where id = b_id and owner_id = auth.uid())
$$;

-- New auth user → profile. Only 'business' or 'creator' can be chosen at signup.
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
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'phone'
  );
  if chosen = 'creator' then
    insert into public.creator_profiles (id) values (new.id);
  end if;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- App users may edit their own profile but never change their own role.
-- Trusted contexts (SQL editor, service role) are not app users and may promote.
-- security invoker on purpose: current_user must be the caller's role.
create or replace function public.prevent_role_change()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.role is distinct from old.role
     and current_user in ('authenticated', 'anon')
     and not public.is_admin() then
    raise exception 'Only an admin can change roles';
  end if;
  return new;
end $$;

create trigger profiles_role_guard
  before update on public.profiles
  for each row execute function public.prevent_role_change();

-- ───────────────────────── RLS ─────────────────────────
alter table public.profiles         enable row level security;
alter table public.businesses       enable row level security;
alter table public.creator_profiles enable row level security;
alter table public.briefs           enable row level security;
alter table public.submissions      enable row level security;
alter table public.payouts          enable row level security;

-- profiles
create policy "profiles: read own or admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles: update own or admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin());

-- businesses
create policy "businesses: owner or admin read" on public.businesses
  for select using (owner_id = auth.uid() or public.is_admin());
create policy "businesses: owner insert" on public.businesses
  for insert with check (owner_id = auth.uid() and public.my_role() = 'business');
create policy "businesses: owner or admin update" on public.businesses
  for update using (owner_id = auth.uid() or public.is_admin());
create policy "businesses: owner or admin delete" on public.businesses
  for delete using (owner_id = auth.uid() or public.is_admin());

-- creator_profiles: any signed-in user can browse creators (needed for matching)
create policy "creators: signed-in read" on public.creator_profiles
  for select using (auth.uid() is not null);
create policy "creators: self or admin update" on public.creator_profiles
  for update using (id = auth.uid() or public.is_admin());

-- briefs
create policy "briefs: business, assigned creator, admin read" on public.briefs
  for select using (
    public.owns_business(business_id)
    or assigned_creator_id = auth.uid()
    or public.is_admin()
  );
create policy "briefs: business insert" on public.briefs
  for insert with check (public.owns_business(business_id));
create policy "briefs: business or admin update" on public.briefs
  for update using (public.owns_business(business_id) or public.is_admin());
create policy "briefs: business or admin delete" on public.briefs
  for delete using (public.owns_business(business_id) or public.is_admin());

-- submissions
create policy "submissions: creator, business, admin read" on public.submissions
  for select using (
    creator_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.briefs b
      where b.id = brief_id and public.owns_business(b.business_id)
    )
  );
create policy "submissions: assigned creator insert" on public.submissions
  for insert with check (
    creator_id = auth.uid()
    and exists (select 1 from public.briefs b where b.id = brief_id and b.assigned_creator_id = auth.uid())
  );
create policy "submissions: business or admin review" on public.submissions
  for update using (
    public.is_admin()
    or exists (
      select 1 from public.briefs b
      where b.id = brief_id and public.owns_business(b.business_id)
    )
  );

-- payouts: creators see their own; only admin writes
create policy "payouts: creator or admin read" on public.payouts
  for select using (creator_id = auth.uid() or public.is_admin());
create policy "payouts: admin write" on public.payouts
  for all using (public.is_admin()) with check (public.is_admin());

-- ───────────────────────── Storage ─────────────────────────
-- Private bucket; files stored as  <creator_id>/<brief_id>/<filename>
insert into storage.buckets (id, name, public)
values ('submissions', 'submissions', false)
on conflict (id) do nothing;

create policy "submissions bucket: creator uploads own folder" on storage.objects
  for insert with check (
    bucket_id = 'submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "submissions bucket: creator, owning business, admin read" on storage.objects
  for select using (
    bucket_id = 'submissions'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
      or exists (
        select 1 from public.briefs b
        where b.id::text = (storage.foldername(name))[2]
          and public.owns_business(b.business_id)
      )
    )
  );
