-- CreatorLoop — standalone full database rebuild.
--
-- This one file contains the complete database interface: types, tables, columns,
-- constraints, indexes, functions, triggers, row-level security, storage rules,
-- roles and grants. It is equal to 0001 + 0002 + 0003 + 0004 + 0005 + 0006 +
-- 0007 + 0008, with only the final version of each object kept.
--
-- Use it when you must recover a project or start a new one:
--   * Run it on an empty Supabase project and the whole app database exists.
--   * Run it on top of 0001–0008 and it makes the database match the final state.
--   * Run it again; it is safe to repeat. It drops and recreates triggers,
--     policies, functions, views-free objects and constraints it manages.
--
-- "Isolated" here means this file has no dependency on the other migration
-- files. It does not create a separate Postgres schema: the Next.js app talks
-- to the "public" schema through Supabase, so all objects live there.
--
-- Requirements: a Supabase project (auth.users, storage.buckets, storage.objects,
-- roles anon/authenticated/service_role already exist) or a local Postgres with
-- supabase/tests/00_supabase_stubs.sql applied.
--
-- Run in the Supabase SQL Editor, or:
--   psql -d <db> -v ON_ERROR_STOP=1 -f supabase/migrations/0009_full_rebuild.sql

begin;

-- Session-scoped helper. Adds a named constraint only when it is missing.
-- This makes the file safe on a fresh database and on a partly migrated one.
create or replace procedure pg_temp.cl_add_constraint(
  p_table text,
  p_name  text,
  p_def   text
) language plpgsql as $$
begin
  if not exists (
    select 1
      from pg_constraint
     where conrelid = to_regclass(p_table)
       and conname = p_name
  ) then
    execute format('alter table %s add constraint %I %s', p_table, p_name, p_def);
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Extension and enums
-- ─────────────────────────────────────────────────────────────────────────────
create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where n.nspname = 'public' and t.typname = 'user_role') then
    create type public.user_role as enum ('business', 'creator', 'admin');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where n.nspname = 'public' and t.typname = 'brief_status') then
    create type public.brief_status as enum (
      'draft', 'open', 'assigned', 'in_review', 'approved', 'completed', 'cancelled'
    );
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where n.nspname = 'public' and t.typname = 'submission_status') then
    create type public.submission_status as enum ('pending', 'changes_requested', 'approved');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where n.nspname = 'public' and t.typname = 'payout_status') then
    create type public.payout_status as enum ('pending', 'paid');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where n.nspname = 'public' and t.typname = 'invoice_status') then
    create type public.invoice_status as enum ('due', 'paid', 'void');
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Tables (final column set; named constraints match the original migrations)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  role       public.user_role not null default 'business',
  full_name  text not null default '',
  phone      text,
  city       text not null default 'Goa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.businesses (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null
                  constraint businesses_owner_id_fkey
                  references public.profiles (id) on delete cascade,
  name            text not null,
  category        text not null,
  area            text,
  instagram       text,
  website         text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  about           text,
  audience        text,
  price_range     text
                  constraint businesses_price_range_check
                  check (price_range is null or price_range in ('budget', 'mid', 'premium')),
  plan            text not null default 'none'
                  constraint businesses_plan_check
                  check (plan in ('none', 'starter', 'growth', 'custom')),
  reels_per_month integer not null default 0
                  constraint businesses_reels_per_month_check
                  check (reels_per_month between 0 and 200)
);

create table if not exists public.creator_profiles (
  id             uuid primary key
                 constraint creator_profiles_id_fkey
                 references public.profiles (id) on delete cascade,
  bio            text,
  niches         text[] not null default '{}',
  instagram      text,
  followers      integer
                 constraint creator_profiles_followers_check
                 check (followers is null or followers >= 0),
  portfolio_urls text[] not null default '{}',
  rate_per_reel  integer
                 constraint creator_profiles_rate_per_reel_check
                 check (rate_per_reel is null or rate_per_reel >= 0),
  is_verified    boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  display_name   text not null default ''
                 constraint creator_profiles_display_name_check
                 check (char_length(display_name) <= 60)
);

create table if not exists public.briefs (
  id                  uuid primary key default gen_random_uuid(),
  business_id         uuid not null
                      constraint briefs_business_id_fkey
                      references public.businesses (id) on delete cascade,
  title               text not null,
  goal                text,
  answers             jsonb not null default '{}',
  ai_brief            jsonb,
  deliverables        integer not null default 1
                      constraint briefs_deliverables_check
                      check (deliverables > 0),
  budget_inr          integer
                      constraint briefs_budget_inr_check
                      check (budget_inr is null or budget_inr >= 0),
  status              public.brief_status not null default 'draft',
  assigned_creator_id uuid
                      constraint briefs_assigned_creator_id_fkey
                      references public.creator_profiles (id) on delete set null,
  due_date            date,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  ai_generations      integer not null default 0
                      constraint briefs_ai_generations_check
                      check (ai_generations >= 0),
  opened_at           timestamptz
);

create table if not exists public.submissions (
  id         uuid primary key default gen_random_uuid(),
  brief_id   uuid not null
             constraint submissions_brief_id_fkey
             references public.briefs (id) on delete cascade,
  creator_id uuid not null
             constraint submissions_creator_id_fkey
             references public.creator_profiles (id) on delete cascade,
  video_path text not null,
  caption    text,
  status     public.submission_status not null default 'pending',
  feedback   text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  views      integer
             constraint submissions_views_check
             check (views is null or (views >= 0 and views <= 1000000000)),
  likes      integer
             constraint submissions_likes_check
             check (likes is null or (likes >= 0 and likes <= 1000000000))
);

create table if not exists public.payouts (
  id         uuid primary key default gen_random_uuid(),
  creator_id uuid not null
             constraint payouts_creator_id_fkey
             references public.creator_profiles (id) on delete cascade,
  brief_id   uuid
             constraint payouts_brief_id_fkey
             references public.briefs (id) on delete set null,
  amount_inr integer not null
             constraint payouts_amount_inr_check
             check (amount_inr >= 0),
  status     public.payout_status not null default 'pending',
  paid_at    timestamptz,
  created_at timestamptz not null default now(),
  note       text
             constraint payouts_note_check
             check (note is null or char_length(note) <= 300)
);

create table if not exists public.ai_usage (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid()
             constraint ai_usage_user_id_fkey
             references public.profiles (id) on delete cascade,
  kind       text not null
             constraint ai_usage_kind_check
             check (kind in ('brief', 'match', 'calendar', 'report')),
  created_at timestamptz not null default now()
);

create table if not exists public.brief_applications (
  id         uuid primary key default gen_random_uuid(),
  brief_id   uuid not null
             constraint brief_applications_brief_id_fkey
             references public.briefs (id) on delete cascade,
  creator_id uuid not null
             constraint brief_applications_creator_id_fkey
             references public.creator_profiles (id) on delete cascade,
  note       text
             constraint brief_applications_note_check
             check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now(),
  constraint brief_applications_brief_id_creator_id_key unique (brief_id, creator_id)
);

create table if not exists public.audit_log (
  id         bigint generated always as identity primary key,
  actor      uuid default auth.uid(),
  action     text not null,
  entity     text not null,
  entity_id  uuid,
  detail     jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.ai_documents (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null
              constraint ai_documents_business_id_fkey
              references public.businesses (id) on delete cascade,
  kind        text not null
              constraint ai_documents_kind_check
              check (kind in ('calendar', 'report')),
  period      date not null
              constraint ai_documents_period_check
              check (extract(day from period) = 1),
  content     jsonb not null
              constraint ai_documents_content_check
              check (octet_length(content::text) <= 40000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint ai_documents_business_id_kind_period_key unique (business_id, kind, period)
);

create table if not exists public.invoices (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null
              constraint invoices_business_id_fkey
              references public.businesses (id) on delete restrict,
  period      date not null
              constraint invoices_period_check
              check (extract(day from period) = 1),
  amount_inr  integer not null
              constraint invoices_amount_inr_check
              check (amount_inr between 0 and 10000000),
  status      public.invoice_status not null default 'due',
  note        text
              constraint invoices_note_check
              check (note is null or char_length(note) <= 300),
  paid_at     timestamptz,
  created_at  timestamptz not null default now(),
  constraint invoices_paid_at_matches check ((status = 'paid') = (paid_at is not null))
);

-- Columns introduced by later migrations. Restores a table that exists but
-- predates that migration (for example after a partial restore).
alter table public.businesses       add column if not exists about           text;
alter table public.businesses       add column if not exists audience        text;
alter table public.businesses       add column if not exists price_range     text;
alter table public.businesses       add column if not exists plan            text not null default 'none';
alter table public.businesses       add column if not exists reels_per_month integer not null default 0;
alter table public.briefs           add column if not exists ai_generations  integer not null default 0;
alter table public.briefs           add column if not exists opened_at       timestamptz;
alter table public.creator_profiles add column if not exists display_name    text not null default '';
alter table public.submissions      add column if not exists views           integer;
alter table public.submissions      add column if not exists likes           integer;
alter table public.payouts          add column if not exists note            text;

-- Backfill the public creator name from the private name where it is empty.
update public.creator_profiles c
   set display_name = left(p.full_name, 60)
  from public.profiles p
 where p.id = c.id
   and c.display_name = ''
   and p.full_name <> '';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Constraints added after 0001, and the final size/format checks
-- ─────────────────────────────────────────────────────────────────────────────
call pg_temp.cl_add_constraint('public.profiles', 'profiles_full_name_len',
  'check (char_length(full_name) <= 120)');
call pg_temp.cl_add_constraint('public.profiles', 'profiles_phone_len',
  'check (phone is null or char_length(phone) <= 20)');
call pg_temp.cl_add_constraint('public.profiles', 'profiles_city_len',
  'check (char_length(city) <= 60)');

call pg_temp.cl_add_constraint('public.businesses', 'businesses_owner_id_fkey',
  'foreign key (owner_id) references public.profiles (id) on delete cascade');
call pg_temp.cl_add_constraint('public.businesses', 'businesses_price_range_check',
  $$check (price_range is null or price_range in ('budget', 'mid', 'premium'))$$);
call pg_temp.cl_add_constraint('public.businesses', 'businesses_name_len',
  'check (char_length(name) between 1 and 80)');
call pg_temp.cl_add_constraint('public.businesses', 'businesses_category_len',
  'check (char_length(category) <= 40)');
call pg_temp.cl_add_constraint('public.businesses', 'businesses_area_len',
  'check (area is null or char_length(area) <= 60)');
call pg_temp.cl_add_constraint('public.businesses', 'businesses_instagram_len',
  'check (instagram is null or char_length(instagram) <= 60)');
call pg_temp.cl_add_constraint('public.businesses', 'businesses_website_len',
  'check (website is null or char_length(website) <= 200)');
call pg_temp.cl_add_constraint('public.businesses', 'businesses_about_len',
  'check (about is null or char_length(about) <= 400)');
call pg_temp.cl_add_constraint('public.businesses', 'businesses_audience_len',
  'check (audience is null or char_length(audience) <= 300)');
call pg_temp.cl_add_constraint('public.businesses', 'businesses_instagram_fmt',
  $$check (instagram is null or instagram ~ '^[A-Za-z0-9._]{1,30}$')$$);
call pg_temp.cl_add_constraint('public.businesses', 'businesses_website_http',
  $$check (website is null or website ~* '^https?://[^[:space:]]+$')$$);
call pg_temp.cl_add_constraint('public.businesses', 'businesses_plan_check',
  $$check (plan in ('none', 'starter', 'growth', 'custom'))$$);
call pg_temp.cl_add_constraint('public.businesses', 'businesses_reels_per_month_check',
  'check (reels_per_month between 0 and 200)');

call pg_temp.cl_add_constraint('public.creator_profiles', 'creator_profiles_id_fkey',
  'foreign key (id) references public.profiles (id) on delete cascade');
call pg_temp.cl_add_constraint('public.creator_profiles', 'creator_profiles_followers_check',
  'check (followers is null or followers >= 0)');
call pg_temp.cl_add_constraint('public.creator_profiles', 'creator_profiles_rate_per_reel_check',
  'check (rate_per_reel is null or rate_per_reel >= 0)');
call pg_temp.cl_add_constraint('public.creator_profiles', 'creator_profiles_display_name_check',
  'check (char_length(display_name) <= 60)');
call pg_temp.cl_add_constraint('public.creator_profiles', 'creators_bio_len',
  'check (bio is null or char_length(bio) <= 600)');
call pg_temp.cl_add_constraint('public.creator_profiles', 'creators_instagram_len',
  'check (instagram is null or char_length(instagram) <= 60)');
call pg_temp.cl_add_constraint('public.creator_profiles', 'creators_niches_len',
  'check (coalesce(array_length(niches, 1), 0) <= 8)');
call pg_temp.cl_add_constraint('public.creator_profiles', 'creators_portfolio_len',
  'check (coalesce(array_length(portfolio_urls, 1), 0) <= 5)');
call pg_temp.cl_add_constraint('public.creator_profiles', 'creators_instagram_fmt',
  $$check (instagram is null or instagram ~ '^[A-Za-z0-9._]{1,30}$')$$);

call pg_temp.cl_add_constraint('public.briefs', 'briefs_business_id_fkey',
  'foreign key (business_id) references public.businesses (id) on delete cascade');
call pg_temp.cl_add_constraint('public.briefs', 'briefs_assigned_creator_id_fkey',
  'foreign key (assigned_creator_id) references public.creator_profiles (id) on delete set null');
call pg_temp.cl_add_constraint('public.briefs', 'briefs_deliverables_check',
  'check (deliverables > 0)');
call pg_temp.cl_add_constraint('public.briefs', 'briefs_budget_inr_check',
  'check (budget_inr is null or budget_inr >= 0)');
call pg_temp.cl_add_constraint('public.briefs', 'briefs_ai_generations_check',
  'check (ai_generations >= 0)');
call pg_temp.cl_add_constraint('public.briefs', 'briefs_title_len',
  'check (char_length(title) between 1 and 200)');
call pg_temp.cl_add_constraint('public.briefs', 'briefs_goal_len',
  'check (goal is null or char_length(goal) <= 40)');
call pg_temp.cl_add_constraint('public.briefs', 'briefs_answers_len',
  'check (octet_length(answers::text) <= 10000)');
call pg_temp.cl_add_constraint('public.briefs', 'briefs_ai_brief_len',
  'check (ai_brief is null or octet_length(ai_brief::text) <= 40000)');
call pg_temp.cl_add_constraint('public.briefs', 'briefs_deliverables_max',
  'check (deliverables <= 8)');

call pg_temp.cl_add_constraint('public.submissions', 'submissions_brief_id_fkey',
  'foreign key (brief_id) references public.briefs (id) on delete cascade');
call pg_temp.cl_add_constraint('public.submissions', 'submissions_creator_id_fkey',
  'foreign key (creator_id) references public.creator_profiles (id) on delete cascade');
call pg_temp.cl_add_constraint('public.submissions', 'submissions_views_check',
  'check (views is null or (views >= 0 and views <= 1000000000))');
call pg_temp.cl_add_constraint('public.submissions', 'submissions_likes_check',
  'check (likes is null or (likes >= 0 and likes <= 1000000000))');
call pg_temp.cl_add_constraint('public.submissions', 'submissions_path_len',
  'check (char_length(video_path) <= 300)');
call pg_temp.cl_add_constraint('public.submissions', 'submissions_caption_len',
  'check (caption is null or char_length(caption) <= 2200)');
call pg_temp.cl_add_constraint('public.submissions', 'submissions_feedback_len',
  'check (feedback is null or char_length(feedback) <= 1000)');

call pg_temp.cl_add_constraint('public.payouts', 'payouts_creator_id_fkey',
  'foreign key (creator_id) references public.creator_profiles (id) on delete cascade');
call pg_temp.cl_add_constraint('public.payouts', 'payouts_brief_id_fkey',
  'foreign key (brief_id) references public.briefs (id) on delete set null');
call pg_temp.cl_add_constraint('public.payouts', 'payouts_amount_inr_check',
  'check (amount_inr >= 0)');
call pg_temp.cl_add_constraint('public.payouts', 'payouts_note_check',
  'check (note is null or char_length(note) <= 300)');
call pg_temp.cl_add_constraint('public.payouts', 'payouts_amount_max',
  'check (amount_inr <= 10000000)');
call pg_temp.cl_add_constraint('public.payouts', 'payouts_paid_at_matches',
  'check ((status = ''paid'') = (paid_at is not null))');

call pg_temp.cl_add_constraint('public.ai_usage', 'ai_usage_user_id_fkey',
  'foreign key (user_id) references public.profiles (id) on delete cascade');
call pg_temp.cl_add_constraint('public.ai_usage', 'ai_usage_kind_check',
  $$check (kind in ('brief', 'match', 'calendar', 'report'))$$);

call pg_temp.cl_add_constraint('public.brief_applications', 'brief_applications_brief_id_fkey',
  'foreign key (brief_id) references public.briefs (id) on delete cascade');
call pg_temp.cl_add_constraint('public.brief_applications', 'brief_applications_creator_id_fkey',
  'foreign key (creator_id) references public.creator_profiles (id) on delete cascade');
call pg_temp.cl_add_constraint('public.brief_applications', 'brief_applications_note_check',
  'check (note is null or char_length(note) <= 500)');
call pg_temp.cl_add_constraint('public.brief_applications',
  'brief_applications_brief_id_creator_id_key', 'unique (brief_id, creator_id)');

call pg_temp.cl_add_constraint('public.ai_documents', 'ai_documents_business_id_fkey',
  'foreign key (business_id) references public.businesses (id) on delete cascade');
call pg_temp.cl_add_constraint('public.ai_documents', 'ai_documents_kind_check',
  $$check (kind in ('calendar', 'report'))$$);
call pg_temp.cl_add_constraint('public.ai_documents', 'ai_documents_period_check',
  'check (extract(day from period) = 1)');
call pg_temp.cl_add_constraint('public.ai_documents', 'ai_documents_content_check',
  'check (octet_length(content::text) <= 40000)');
call pg_temp.cl_add_constraint('public.ai_documents',
  'ai_documents_business_id_kind_period_key', 'unique (business_id, kind, period)');

call pg_temp.cl_add_constraint('public.invoices', 'invoices_business_id_fkey',
  'foreign key (business_id) references public.businesses (id) on delete restrict');
call pg_temp.cl_add_constraint('public.invoices', 'invoices_period_check',
  'check (extract(day from period) = 1)');
call pg_temp.cl_add_constraint('public.invoices', 'invoices_amount_inr_check',
  'check (amount_inr between 0 and 10000000)');
call pg_temp.cl_add_constraint('public.invoices', 'invoices_note_check',
  'check (note is null or char_length(note) <= 300)');
call pg_temp.cl_add_constraint('public.invoices', 'invoices_paid_at_matches',
  'check ((status = ''paid'') = (paid_at is not null))');

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Indexes
-- ─────────────────────────────────────────────────────────────────────────────
create index if not exists businesses_owner_idx       on public.businesses (owner_id);
create index if not exists briefs_business_idx        on public.briefs (business_id);
create index if not exists briefs_creator_idx         on public.briefs (assigned_creator_id);
create index if not exists briefs_status_idx          on public.briefs (status);
create index if not exists submissions_brief_idx      on public.submissions (brief_id);
create index if not exists submissions_creator_idx    on public.submissions (creator_id);
create index if not exists payouts_creator_idx        on public.payouts (creator_id);
create index if not exists ai_usage_user_day_idx      on public.ai_usage (user_id, created_at desc);
create index if not exists brief_applications_creator_idx on public.brief_applications (creator_id);
create index if not exists audit_log_created_idx      on public.audit_log (created_at desc);
create index if not exists invoices_business_idx      on public.invoices (business_id);
create unique index if not exists businesses_one_per_owner on public.businesses (owner_id);
create unique index if not exists payouts_one_per_brief on public.payouts (brief_id) where brief_id is not null;
create unique index if not exists invoices_one_live_per_month on public.invoices (business_id, period) where status <> 'void';

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Functions (only the final version of each)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

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

create or replace function public.guard_brief_update()
returns trigger language plpgsql set search_path = public as $$
declare
  biz_plan text;
  allowance integer;
  used integer;
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

  if new.status = 'open' and old.status = 'draft' then
    select plan, reels_per_month into biz_plan, allowance
      from public.businesses where id = new.business_id;
    if biz_plan is null or biz_plan = 'none' then
      raise exception 'PLAN_REQUIRED';
    end if;
    select coalesce(sum(deliverables), 0) into used
      from public.briefs
     where business_id = new.business_id
       and id <> new.id
       and status not in ('draft', 'cancelled')
       and opened_at >= public.month_start_ist();
    if used + new.deliverables > allowance then
      raise exception 'PLAN_LIMIT';
    end if;
    new.opened_at := now();
  elsif new.opened_at is distinct from old.opened_at then
    raise exception 'opened_at is set by the system';
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

create or replace function public.guard_submission_update()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    if (new.brief_id, new.creator_id, new.video_path, new.created_at)
         is distinct from (old.brief_id, old.creator_id, old.video_path, old.created_at)
       or new.caption is distinct from old.caption then
      raise exception 'Only the review status, feedback and results can be changed';
    end if;
    if new.status is distinct from old.status and old.status <> 'pending' then
      raise exception 'This reel has already been reviewed';
    end if;
    if (new.views is distinct from old.views or new.likes is distinct from old.likes)
       and (old.status <> 'approved' or new.status <> 'approved') then
      raise exception 'Results can only be logged for approved reels';
    end if;
  end if;
  return new;
end $$;

create or replace function public.guard_payout_change()
returns trigger language plpgsql set search_path = public as $$
begin
  if old.status = 'paid' and current_user in ('authenticated', 'anon') then
    raise exception 'Paid payouts are locked';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end $$;

create or replace function public.guard_business_write()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    if tg_op = 'INSERT' then
      new.plan := 'none';
      new.reels_per_month := 0;
    elsif (new.plan, new.reels_per_month, new.owner_id)
          is distinct from (old.plan, old.reels_per_month, old.owner_id) then
      raise exception 'Only an admin can change the plan';
    end if;
  end if;
  return new;
end $$;

create or replace function public.guard_invoice_change()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon') then
    if old.status <> 'due' then
      raise exception 'This invoice is closed';
    end if;
    if tg_op = 'DELETE' then
      raise exception 'Invoices are voided, not deleted';
    end if;
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end $$;

create or replace function public.month_start_ist()
returns timestamptz language sql stable set search_path = '' as $$
  select date_trunc('month', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata'
$$;

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

create or replace function public.all_http_urls(urls text[])
returns boolean language sql immutable set search_path = '' as $$
  select coalesce(bool_and(u ~* '^https?://[^[:space:]]+$' and char_length(u) <= 300), true)
    from unnest(urls) as u
$$;

-- Added here because the check calls the function above.
call pg_temp.cl_add_constraint('public.creator_profiles', 'creators_portfolio_http',
  'check (public.all_http_urls(portfolio_urls))');

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

create or replace function public.admin_close_brief(p_brief uuid, p_amount integer, p_note text default null)
returns uuid
language plpgsql set search_path = public as $$
declare
  b public.briefs%rowtype;
  payout_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;
  select * into b from public.briefs where id = p_brief for update;
  if not found or b.status <> 'approved' or b.assigned_creator_id is null then
    raise exception 'This brief is not ready to close';
  end if;
  insert into public.payouts (creator_id, brief_id, amount_inr, note)
  values (b.assigned_creator_id, b.id, p_amount, nullif(trim(p_note), ''))
  returning id into payout_id;
  update public.briefs set status = 'completed' where id = b.id;
  return payout_id;
end $$;

create or replace function public.log_audit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'payouts' then
    insert into public.audit_log (action, entity, entity_id, detail)
    values (
      case when tg_op = 'INSERT' then 'payout_created' else 'payout_' || new.status::text end,
      'payout', new.id,
      jsonb_build_object('amount_inr', new.amount_inr, 'creator_id', new.creator_id, 'brief_id', new.brief_id)
    );
  elsif tg_table_name = 'invoices' then
    insert into public.audit_log (action, entity, entity_id, detail)
    values (
      case when tg_op = 'INSERT' then 'invoice_created' else 'invoice_' || new.status::text end,
      'invoice', new.id,
      jsonb_build_object('amount_inr', new.amount_inr, 'business_id', new.business_id, 'period', new.period)
    );
  elsif tg_table_name = 'businesses' then
    if (new.plan, new.reels_per_month) is distinct from (old.plan, old.reels_per_month) then
      insert into public.audit_log (action, entity, entity_id, detail)
      values ('plan_changed', 'business', new.id,
              jsonb_build_object('from', old.plan, 'to', new.plan, 'reels_per_month', new.reels_per_month));
    end if;
  elsif tg_table_name = 'briefs' then
    if new.assigned_creator_id is distinct from old.assigned_creator_id
       or new.status is distinct from old.status
       or new.budget_inr is distinct from old.budget_inr then
      insert into public.audit_log (action, entity, entity_id, detail)
      values (
        'brief_' || new.status::text, 'brief', new.id,
        jsonb_build_object('from', old.status, 'creator_id', new.assigned_creator_id, 'budget_inr', new.budget_inr)
      );
    end if;
  elsif tg_table_name = 'creator_profiles' then
    if new.is_verified is distinct from old.is_verified then
      insert into public.audit_log (action, entity, entity_id)
      values (case when new.is_verified then 'creator_verified' else 'creator_unverified' end, 'creator', new.id);
    end if;
  elsif tg_table_name = 'profiles' then
    if new.role is distinct from old.role then
      insert into public.audit_log (action, entity, entity_id, detail)
      values ('role_changed', 'profile', new.id, jsonb_build_object('from', old.role, 'to', new.role));
    end if;
  end if;
  return new;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Triggers (drop first so a repeat run cannot add duplicates)
-- ─────────────────────────────────────────────────────────────────────────────
drop trigger if exists profiles_updated_at         on public.profiles;
drop trigger if exists businesses_updated_at       on public.businesses;
drop trigger if exists creator_profiles_updated_at on public.creator_profiles;
drop trigger if exists briefs_updated_at           on public.briefs;
drop trigger if exists submissions_updated_at      on public.submissions;
drop trigger if exists ai_documents_updated_at     on public.ai_documents;
create trigger profiles_updated_at         before update on public.profiles         for each row execute function public.set_updated_at();
create trigger businesses_updated_at       before update on public.businesses       for each row execute function public.set_updated_at();
create trigger creator_profiles_updated_at before update on public.creator_profiles for each row execute function public.set_updated_at();
create trigger briefs_updated_at           before update on public.briefs           for each row execute function public.set_updated_at();
create trigger submissions_updated_at      before update on public.submissions      for each row execute function public.set_updated_at();
create trigger ai_documents_updated_at     before update on public.ai_documents     for each row execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists profiles_role_guard on public.profiles;
create trigger profiles_role_guard before update on public.profiles
  for each row execute function public.prevent_role_change();

drop trigger if exists briefs_update_guard on public.briefs;
drop trigger if exists briefs_insert_guard on public.briefs;
create trigger briefs_update_guard before update on public.briefs
  for each row execute function public.guard_brief_update();
create trigger briefs_insert_guard before insert on public.briefs
  for each row execute function public.guard_brief_insert();

drop trigger if exists creator_profiles_update_guard on public.creator_profiles;
create trigger creator_profiles_update_guard before update on public.creator_profiles
  for each row execute function public.guard_creator_profile_update();

drop trigger if exists submissions_insert_guard on public.submissions;
drop trigger if exists submissions_update_guard on public.submissions;
drop trigger if exists submissions_sync_brief_status on public.submissions;
create trigger submissions_insert_guard before insert on public.submissions
  for each row execute function public.guard_submission_insert();
create trigger submissions_update_guard before update on public.submissions
  for each row execute function public.guard_submission_update();
create trigger submissions_sync_brief_status after insert or update of status on public.submissions
  for each row execute function public.sync_brief_status();

drop trigger if exists payouts_change_guard on public.payouts;
create trigger payouts_change_guard before update or delete on public.payouts
  for each row execute function public.guard_payout_change();

drop trigger if exists businesses_write_guard on public.businesses;
create trigger businesses_write_guard before insert or update on public.businesses
  for each row execute function public.guard_business_write();

drop trigger if exists invoices_change_guard on public.invoices;
create trigger invoices_change_guard before update or delete on public.invoices
  for each row execute function public.guard_invoice_change();

drop trigger if exists payouts_audit on public.payouts;
drop trigger if exists briefs_audit on public.briefs;
drop trigger if exists creator_profiles_audit on public.creator_profiles;
drop trigger if exists profiles_audit on public.profiles;
drop trigger if exists invoices_audit on public.invoices;
drop trigger if exists businesses_audit on public.businesses;
create trigger payouts_audit after insert or update on public.payouts for each row execute function public.log_audit();
create trigger briefs_audit after update on public.briefs for each row execute function public.log_audit();
create trigger creator_profiles_audit after update on public.creator_profiles for each row execute function public.log_audit();
create trigger profiles_audit after update on public.profiles for each row execute function public.log_audit();
create trigger invoices_audit after insert or update on public.invoices for each row execute function public.log_audit();
create trigger businesses_audit after update on public.businesses for each row execute function public.log_audit();

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Row-level security — replace every policy on app tables with the final set
-- ─────────────────────────────────────────────────────────────────────────────
do $$
declare r record;
begin
  for r in select schemaname, tablename, policyname from pg_policies where schemaname = 'public' loop
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

alter table public.profiles         enable row level security;
alter table public.businesses       enable row level security;
alter table public.creator_profiles enable row level security;
alter table public.briefs           enable row level security;
alter table public.submissions      enable row level security;
alter table public.payouts          enable row level security;
alter table public.ai_usage         enable row level security;
alter table public.brief_applications enable row level security;
alter table public.audit_log        enable row level security;
alter table public.ai_documents     enable row level security;
alter table public.invoices         enable row level security;

create policy "profiles: read own or admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles: update own or admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin());

create policy "businesses: owner or admin read" on public.businesses
  for select using (owner_id = auth.uid() or public.is_admin());
create policy "businesses: creators with a visible brief" on public.businesses
  for select using (public.creator_can_see_business(id));
create policy "businesses: owner insert" on public.businesses
  for insert with check (owner_id = auth.uid() and public.my_role() = 'business');
create policy "businesses: owner or admin update" on public.businesses
  for update using (owner_id = auth.uid() or public.is_admin());
create policy "businesses: admin delete" on public.businesses
  for delete using (public.is_admin());

create policy "creators: self, admin, or their client" on public.creator_profiles
  for select using (id = auth.uid() or public.is_admin() or public.works_with_creator(id));
create policy "creators: self or admin update" on public.creator_profiles
  for update using (id = auth.uid() or public.is_admin());

create policy "briefs: business, assigned creator, admin read" on public.briefs
  for select using (
    public.owns_business(business_id)
    or assigned_creator_id = auth.uid()
    or public.is_admin()
  );
create policy "briefs: creators read open" on public.briefs
  for select using (status = 'open' and public.my_role() = 'creator');
create policy "briefs: business insert" on public.briefs
  for insert with check (public.owns_business(business_id));
create policy "briefs: business or admin update" on public.briefs
  for update using (public.owns_business(business_id) or public.is_admin());
create policy "briefs: business deletes drafts, admin any" on public.briefs
  for delete using (
    (public.owns_business(business_id) and status in ('draft', 'cancelled'))
    or public.is_admin()
  );

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
    and exists (
      select 1 from public.briefs b
      where b.id = brief_id
        and b.assigned_creator_id = auth.uid()
        and b.status in ('assigned', 'in_review')
    )
  );
create policy "submissions: business or admin review" on public.submissions
  for update using (
    public.is_admin()
    or exists (
      select 1 from public.briefs b
      where b.id = brief_id and public.owns_business(b.business_id)
    )
  );

create policy "payouts: creator or admin read" on public.payouts
  for select using (creator_id = auth.uid() or public.is_admin());
create policy "payouts: admin write" on public.payouts
  for all using (public.is_admin()) with check (public.is_admin());

create policy "applications: creator or admin read" on public.brief_applications
  for select using (creator_id = auth.uid() or public.is_admin());
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
create policy "applications: creator withdraws, admin removes" on public.brief_applications
  for delete using (creator_id = auth.uid() or public.is_admin());

create policy "ai_usage: read own or admin" on public.ai_usage
  for select using (user_id = auth.uid() or public.is_admin());
create policy "ai_usage: insert own" on public.ai_usage
  for insert with check (user_id = auth.uid());

create policy "ai_documents: owner or admin read" on public.ai_documents
  for select using (public.owns_business(business_id) or public.is_admin());
create policy "ai_documents: owner insert" on public.ai_documents
  for insert with check (public.owns_business(business_id));
create policy "ai_documents: owner update" on public.ai_documents
  for update using (public.owns_business(business_id)) with check (public.owns_business(business_id));

create policy "invoices: owner or admin read" on public.invoices
  for select using (public.owns_business(business_id) or public.is_admin());
create policy "invoices: admin write" on public.invoices
  for all using (public.is_admin()) with check (public.is_admin());

create policy "audit_log: admin read" on public.audit_log
  for select using (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Storage — private submissions bucket, one-hour signed links at the app layer
-- ─────────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('submissions', 'submissions', false)
on conflict (id) do nothing;

update storage.buckets
   set file_size_limit = 52428800,
       allowed_mime_types = array['video/mp4', 'video/quicktime', 'video/webm']
 where id = 'submissions';

drop policy if exists "submissions bucket: creator uploads own folder" on storage.objects;
drop policy if exists "submissions bucket: creator uploads for assigned brief" on storage.objects;
drop policy if exists "submissions bucket: creator, owning business, admin read" on storage.objects;

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

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. Grants — trigger functions and helpers are not callable through the API
-- ─────────────────────────────────────────────────────────────────────────────
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.sync_brief_status() from public, anon, authenticated;
revoke execute on function public.log_audit() from public, anon, authenticated;

revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.my_role() from public, anon;
revoke execute on function public.owns_business(uuid) from public, anon;
revoke execute on function public.creator_can_see_business(uuid) from public, anon;
revoke execute on function public.works_with_creator(uuid) from public, anon;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.my_role() to authenticated;
grant execute on function public.owns_business(uuid) to authenticated;
grant execute on function public.creator_can_see_business(uuid) to authenticated;
grant execute on function public.works_with_creator(uuid) to authenticated;

revoke execute on function public.admin_close_brief(uuid, integer, text) from public, anon;
grant execute on function public.admin_close_brief(uuid, integer, text) to authenticated;

do $$ begin raise notice 'CreatorLoop full rebuild applied.'; end $$;

commit;
