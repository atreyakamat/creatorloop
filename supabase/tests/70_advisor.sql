\set ON_ERROR_STOP 0
-- Checks for 0007_advisor_hardening.sql.
select 'S1 signed-out callers cannot run access helpers -> ' ||
  has_function_privilege('anon', 'public.is_admin()', 'execute') || '/' ||
  has_function_privilege('anon', 'public.owns_business(uuid)', 'execute') || '/' ||
  has_function_privilege('anon', 'public.handle_new_user()', 'execute') || ' (expect false/false/false)';
select 'S2 signed-in sessions keep the helpers RLS needs, not the triggers -> ' ||
  has_function_privilege('authenticated', 'public.is_admin()', 'execute') || '/' ||
  has_function_privilege('authenticated', 'public.handle_new_user()', 'execute') || '/' ||
  has_function_privilege('authenticated', 'public.log_audit()', 'execute') || '/' ||
  has_function_privilege('authenticated', 'public.sync_brief_status()', 'execute') || ' (expect true/false/false/false)';
select 'S3 every function has a pinned search path -> ' || count(*) || ' (expect 0)'
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')  -- skip extension functions
   and (p.proconfig is null or not exists (select 1 from unnest(p.proconfig) c where c like 'search_path=%'));
select 'S4 every table has row-level security on -> ' || count(*) || ' (expect 0)'
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;
-- New signups still work after the revokes (trigger runs as the table owner).
insert into auth.users (id, email, raw_user_meta_data) values ('99999999-0000-0000-0000-000000000001','late@x.com','{"role":"creator","full_name":"Late Joiner"}');
select 'S5 signup trigger still creates profile and creator row -> ' || p.role || '/' || c.display_name || ' (expect creator/Late Joiner)'
  from public.profiles p join public.creator_profiles c on c.id = p.id where p.id = '99999999-0000-0000-0000-000000000001';
