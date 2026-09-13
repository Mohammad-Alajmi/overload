-- Finding 2 (Red), corrected and verified.
--
-- Row Level Security decides WHICH ROWS a member may touch. It says nothing
-- about WHICH COLUMNS. The owner-only UPDATE policy was letting a member
-- rewrite every field on their own row, including the email address that is
-- supposed to mirror their verified login identity.
--
-- Supabase grants table-wide UPDATE to `authenticated`, so the table-level
-- grant has to be removed first; only then do column grants mean anything.
revoke update on public.profiles from authenticated, anon;

grant update (display_name, active_routine, rest_seconds)
  on public.profiles to authenticated;

-- Verified after applying:
--   PATCH /rest/v1/profiles {"email":"..."}        -> HTTP 403, value unchanged
--   PATCH /rest/v1/profiles {"display_name":"..."} -> HTTP 200, still works
--   has_table_privilege('authenticated','public.profiles','update') -> false
