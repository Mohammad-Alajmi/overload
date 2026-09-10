-- Real, queryable user info instead of JSON in auth metadata.
create table public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  email          text not null,
  display_name   text not null
                   check (char_length(trim(display_name)) between 1 and 40),
  active_routine text not null default 'upper-lower-4'
                   check (active_routine in ('full-body-3','upper-lower-4','ppl-6')),
  rest_seconds   integer not null default 90
                   check (rest_seconds between 15 and 600),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Same shape as sets: owner-only, scoped to authenticated, nothing for anon.
create policy "own profile readable"  on public.profiles for select to authenticated
  using      (auth.uid() = id);
create policy "own profile updatable" on public.profiles for update to authenticated
  using      (auth.uid() = id) with check (auth.uid() = id);

-- A row is created by the trigger below, which runs as owner, so members are
-- never allowed to insert or delete their own profile row directly.

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Creates the profile row the moment an account is created, so the app never
-- has to cope with a signed-in member who has no profile.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name, active_routine)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      split_part(new.email, '@', 1)
    ),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'active_routine', ''),
      'upper-lower-4'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep the stored email in step if the account email ever changes.
create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function public.sync_profile_email();

-- Backfill the accounts that already exist.
insert into public.profiles (id, email, display_name, active_routine, created_at)
select
  u.id,
  u.email,
  coalesce(
    nullif(trim(u.raw_user_meta_data ->> 'display_name'), ''),
    split_part(u.email, '@', 1)
  ),
  coalesce(nullif(u.raw_user_meta_data ->> 'active_routine', ''), 'upper-lower-4'),
  u.created_at
from auth.users u
on conflict (id) do nothing;

-- The session screen asks "what did this member last lift for this exercise?"
-- once per exercise, so index for exactly that lookup.
drop index if exists sets_user_lift_idx;
create index sets_user_lift_recent_idx
  on public.sets (user_id, lift, performed_on desc, created_at desc);
