-- Finding 7 (Yellow).
--
-- The trigger was inserting raw sign-up metadata straight into constrained
-- columns, so a 200-character name made the whole sign-up fail with HTTP 500
-- that echoed the constraint name and the contents of the failing row.
--
-- Data arriving from a sign-up form is attacker-controlled. The trigger now
-- trims it to fit instead of trusting it and letting the constraint fire.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  safe_name    text;
  raw_routine  text;
  safe_routine text;
begin
  -- Trim to the column's 40-character limit rather than letting it overflow.
  safe_name := left(
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    40
  );
  if safe_name is null or length(trim(safe_name)) = 0 then
    safe_name := 'Member';
  end if;

  -- Accept the routine only if it is one we recognise; anything else, including
  -- an injection attempt, silently becomes the default.
  raw_routine := new.raw_user_meta_data ->> 'active_routine';
  safe_routine := case
    when raw_routine in ('full-body-3', 'upper-lower-4', 'ppl-6') then raw_routine
    else 'upper-lower-4'
  end;

  insert into public.profiles (id, email, display_name, active_routine)
  values (
    new.id,
    -- email is NOT NULL on profiles; fall back so a future non-email sign-in
    -- method cannot break account creation.
    coalesce(new.email, new.phone, new.id::text),
    safe_name,
    safe_routine
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- CREATE OR REPLACE resets privileges, so take EXECUTE away again.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
