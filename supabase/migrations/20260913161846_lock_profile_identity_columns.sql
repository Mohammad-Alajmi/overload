-- Finding 2 (Red). FIRST ATTEMPT - DID NOT WORK. Kept for the record; the
-- migration immediately after this one is the fix.
--
-- Revoking UPDATE on individual columns does nothing while the role still holds
-- table-wide UPDATE: in Postgres the effective privilege is the union of the
-- table-level and column-level grants. Verified by re-running the attack after
-- applying this, which still succeeded with HTTP 200.
revoke update (id, email, created_at, updated_at)
  on public.profiles from authenticated;

grant update (display_name, active_routine, rest_seconds)
  on public.profiles to authenticated;
