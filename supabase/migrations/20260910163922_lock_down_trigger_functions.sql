-- These are trigger functions. They are not part of the API and must never be
-- reachable at /rest/v1/rpc/..., which is where PostgREST exposes anything in
-- the public schema that a role can execute. Postgres grants EXECUTE to PUBLIC
-- on new functions by default, so it has to be taken away explicitly.
--
-- Caught by Supabase's own security advisor after the previous migration:
-- `anon_security_definer_function_executable`.
revoke execute on function public.handle_new_user()   from public, anon, authenticated;
revoke execute on function public.sync_profile_email() from public, anon, authenticated;
revoke execute on function public.touch_updated_at()   from public, anon, authenticated;
