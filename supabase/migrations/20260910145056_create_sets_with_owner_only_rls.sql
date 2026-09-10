create table public.sets (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid()
                 references auth.users(id) on delete cascade,
  lift         text not null check (char_length(trim(lift)) between 1 and 60),
  weight_kg    numeric(6,2) not null check (weight_kg >= 0 and weight_kg <= 999),
  reps         integer      not null check (reps      >= 1 and reps      <= 100),
  rpe          numeric(3,1)          check (rpe       >= 1 and rpe       <= 10),
  performed_on date         not null default current_date,
  routine_slug text                  check (routine_slug in ('full-body-3','upper-lower-4','ppl-6')),
  routine_day  text                  check (char_length(routine_day) <= 40),
  note         text                  check (char_length(note) <= 280),
  created_at   timestamptz  not null default now()
);

create index sets_user_date_idx on public.sets (user_id, performed_on desc);
create index sets_user_lift_idx on public.sets (user_id, lift);

alter table public.sets enable row level security;

-- `to authenticated` is the clause that makes the anonymous check pass: nothing
-- is granted to the anon role, so an anonymous caller matches no policy at all.
create policy "own rows readable"   on public.sets for select to authenticated
  using      (auth.uid() = user_id);
create policy "own rows insertable" on public.sets for insert to authenticated
  with check (auth.uid() = user_id);
create policy "own rows updatable"  on public.sets for update to authenticated
  using      (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows deletable"  on public.sets for delete to authenticated
  using      (auth.uid() = user_id);
