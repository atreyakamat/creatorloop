-- CreatorLoop — Phase 5: reel results, AI content plans and monthly reports.

-- Results the business logs after posting an approved reel (feeds the monthly report).
alter table public.submissions
  add column views integer check (views is null or (views >= 0 and views <= 1000000000)),
  add column likes integer check (likes is null or (likes >= 0 and likes <= 1000000000));

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

-- AI-written documents per business: one content plan and one report per month.
create table public.ai_documents (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses (id) on delete cascade,
  kind         text not null check (kind in ('calendar', 'report')),
  period       date not null check (extract(day from period) = 1),  -- first day of the month
  content      jsonb not null check (octet_length(content::text) <= 40000),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (business_id, kind, period)
);

create trigger ai_documents_updated_at before update on public.ai_documents
  for each row execute function public.set_updated_at();

alter table public.ai_documents enable row level security;

create policy "ai_documents: owner or admin read" on public.ai_documents
  for select using (public.owns_business(business_id) or public.is_admin());
create policy "ai_documents: owner insert" on public.ai_documents
  for insert with check (public.owns_business(business_id));
create policy "ai_documents: owner update" on public.ai_documents
  for update using (public.owns_business(business_id)) with check (public.owns_business(business_id));
