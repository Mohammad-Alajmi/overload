-- Finding 8 (Yellow).
--
-- One account could insert without limit: 30 rows were accepted in 674ms and
-- nothing counted them. Enforced in the database rather than the application,
-- so it still holds for a caller talking to PostgREST directly.
--
-- 5000 sets is several years of hard training, so no real member meets it.
create or replace function public.enforce_set_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.sets where user_id = new.user_id) >= 5000 then
    raise exception 'This account has reached the limit of 5000 logged sets.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger sets_enforce_quota
  before insert on public.sets
  for each row execute function public.enforce_set_quota();

revoke execute on function public.enforce_set_quota() from public, anon, authenticated;
