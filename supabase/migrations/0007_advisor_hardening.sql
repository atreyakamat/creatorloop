-- CreatorLoop — fixes for Supabase's security advisor (docs/security/final-review.md).

-- Pin the search path on the remaining functions.
alter function public.set_updated_at() set search_path = '';
alter function public.all_http_urls(text[]) set search_path = '';

-- Trigger-only functions never need to be callable through the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Access-rule helpers are needed by signed-in sessions only (row-level security
-- calls them). They answer questions about the caller alone, never about others.
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
