-- CreatorLoop — Phase 4: admin operations and payouts.

alter table public.payouts
  add column note text check (note is null or char_length(note) <= 300),
  add constraint payouts_amount_max check (amount_inr <= 10000000),
  add constraint payouts_paid_at_matches check ((status = 'paid') = (paid_at is not null));

-- A brief is paid out once.
create unique index payouts_one_per_brief on public.payouts (brief_id) where brief_id is not null;

-- Close an approved brief and create the creator's payout in one transaction.
-- Runs with the caller's rights, so RLS still applies; the admin check is explicit too.
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

revoke execute on function public.admin_close_brief(uuid, integer, text) from public, anon;
grant execute on function public.admin_close_brief(uuid, integer, text) to authenticated;

-- ── Hardening found in the Phase 4 audit (docs/security/phase-4-audit.md) ───

-- D1. Paid payouts are a financial record: nobody edits or deletes them through the app.
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

create trigger payouts_change_guard
  before update or delete on public.payouts
  for each row execute function public.guard_payout_change();

-- D2. Append-only audit trail for money and privilege changes. Written only by
--     triggers; readable only by admins; no client can insert, edit or delete.
create table public.audit_log (
  id          bigint generated always as identity primary key,
  actor       uuid default auth.uid(),
  action      text not null,
  entity      text not null,
  entity_id   uuid,
  detail      jsonb not null default '{}',
  created_at  timestamptz not null default now()
);
create index audit_log_created_idx on public.audit_log (created_at desc);

alter table public.audit_log enable row level security;
create policy "audit_log: admin read" on public.audit_log
  for select using (public.is_admin());

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

create trigger payouts_audit after insert or update on public.payouts
  for each row execute function public.log_audit();
create trigger briefs_audit after update on public.briefs
  for each row execute function public.log_audit();
create trigger creator_profiles_audit after update on public.creator_profiles
  for each row execute function public.log_audit();
create trigger profiles_audit after update on public.profiles
  for each row execute function public.log_audit();
