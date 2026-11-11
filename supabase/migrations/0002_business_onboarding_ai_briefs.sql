-- CreatorLoop — Phase 2: business details, AI brief usage, brief update guards.

-- Richer business profile (feeds the AI brief prompt).
alter table public.businesses
  add column about        text,          -- what they sell, in their words
  add column audience     text,          -- who comes in today
  add column price_range  text check (price_range is null or price_range in ('budget', 'mid', 'premium'));

-- How many times AI has written this brief (caps regenerations).
alter table public.briefs
  add column ai_generations integer not null default 0 check (ai_generations >= 0);

-- Businesses own their briefs but must not be able to:
--   • assign creators (admin does matching)
--   • jump a brief to in_review / approved / completed (that follows real deliveries)
--   • reset the AI usage counter
-- Admin and trusted contexts (SQL editor, service role) are unrestricted.
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

  if new.ai_generations < old.ai_generations then
    raise exception 'AI usage cannot be reset';
  end if;

  if new.status is distinct from old.status
     and not (old.status in ('draft', 'open') and new.status in ('draft', 'open', 'cancelled')) then
    raise exception 'Brief status % → % is not allowed', old.status, new.status;
  end if;

  return new;
end $$;

create trigger briefs_update_guard
  before update on public.briefs
  for each row execute function public.guard_brief_update();

-- New briefs from businesses always start clean.
create or replace function public.guard_brief_insert()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    new.status := 'draft';
    new.assigned_creator_id := null;
    new.ai_generations := 0;
  end if;
  return new;
end $$;

create trigger briefs_insert_guard
  before insert on public.briefs
  for each row execute function public.guard_brief_insert();
