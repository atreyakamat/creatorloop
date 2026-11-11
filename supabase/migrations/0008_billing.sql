-- CreatorLoop — launch: plans, monthly reel allowance and invoices.
-- Money moves outside the app (UPI or bank). The app records plans and invoices.

alter table public.businesses
  add column plan text not null default 'none' check (plan in ('none', 'starter', 'growth', 'custom')),
  add column reels_per_month integer not null default 0 check (reels_per_month between 0 and 200);

alter table public.briefs
  add column opened_at timestamptz;   -- when the business sent it to creators (counts toward the month)

-- Only an admin sets a plan or allowance. New businesses always start without one.
create or replace function public.guard_business_write()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    if tg_op = 'INSERT' then
      new.plan := 'none';
      new.reels_per_month := 0;
    elsif (new.plan, new.reels_per_month, new.owner_id) is distinct from (old.plan, old.reels_per_month, old.owner_id) then
      raise exception 'Only an admin can change the plan';
    end if;
  end if;
  return new;
end $$;

create trigger businesses_write_guard
  before insert or update on public.businesses
  for each row execute function public.guard_business_write();

-- Start of the current month in India time.
create or replace function public.month_start_ist()
returns timestamptz language sql stable set search_path = '' as $$
  select date_trunc('month', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata'
$$;

-- Sending a brief to creators needs an active plan with reels left this month.
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

-- ── Invoices ────────────────────────────────────────────────────────────────
create type public.invoice_status as enum ('due', 'paid', 'void');

create table public.invoices (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses (id) on delete restrict,
  period       date not null check (extract(day from period) = 1),
  amount_inr   integer not null check (amount_inr between 0 and 10000000),
  status       public.invoice_status not null default 'due',
  note         text check (note is null or char_length(note) <= 300),
  paid_at      timestamptz,
  created_at   timestamptz not null default now(),
  constraint invoices_paid_at_matches check ((status = 'paid') = (paid_at is not null))
);
create unique index invoices_one_live_per_month on public.invoices (business_id, period) where status <> 'void';
create index invoices_business_idx on public.invoices (business_id);

alter table public.invoices enable row level security;
create policy "invoices: owner or admin read" on public.invoices
  for select using (public.owns_business(business_id) or public.is_admin());
create policy "invoices: admin write" on public.invoices
  for all using (public.is_admin()) with check (public.is_admin());

-- Paid or void invoices are records: nobody edits or deletes them through the app.
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

create trigger invoices_change_guard
  before update or delete on public.invoices
  for each row execute function public.guard_invoice_change();

-- ── Audit trail: plans and invoices ─────────────────────────────────────────
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

revoke execute on function public.log_audit() from public, anon, authenticated;

create trigger invoices_audit after insert or update on public.invoices
  for each row execute function public.log_audit();
create trigger businesses_audit after update on public.businesses
  for each row execute function public.log_audit();
