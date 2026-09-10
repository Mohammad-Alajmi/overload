# Overload

A gym set tracker. Log the lift, the weight, the reps and the day; Overload works
out your estimated one-rep max so you can see whether you are actually getting
stronger.

- **Live:** _pending first deploy_
- **Repo:** _pending_

Built with Next.js (App Router), TypeScript, Tailwind and Supabase. Deployed on
Vercel. Supabase project in `eu-central-1`.

---

## The part that matters: only the owner can read a row

The brief puts 250 of 1000 points on one test, and is explicit that a UI filter
does not count:

> Hiding rows in your page is not a lock. We ask your database directly, with
> nobody logged in. If any row comes back, you have a filter, not a policy.

So the lock is a Row Level Security policy on the table, not a `where` clause in
the app. There is no service-role key anywhere in this codebase — the browser and
the server both use the publishable key, which is public by design, and every
request carries the signed-in member's own JWT.

### Schema

```sql
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
```

### Policies

```sql
alter table public.sets enable row level security;

create policy "own rows readable"   on public.sets for select to authenticated
  using      (auth.uid() = user_id);
create policy "own rows insertable" on public.sets for insert to authenticated
  with check (auth.uid() = user_id);
create policy "own rows updatable"  on public.sets for update to authenticated
  using      (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows deletable"  on public.sets for delete to authenticated
  using      (auth.uid() = user_id);
```

### Why it is written this way

**`to authenticated` on every policy.** This is the clause that makes the
anonymous check pass. Postgres denies by default once RLS is enabled, and no
policy grants anything to the `anon` role — so an anonymous caller matches no
policy and sees no rows. Writing `to public` instead would have let the anon role
be evaluated against `auth.uid() = user_id`, where `auth.uid()` is null, and the
result would depend on null comparison rules rather than on an explicit decision.

**`user_id` defaults to `auth.uid()` and is never sent by the client.** A client
cannot claim to be somebody else, because it does not supply the column at all.
The `with check` clause then rejects any insert that somehow tried.

**A separate policy per command.** One `for all` policy would be shorter, but
`using` and `with check` mean different things for reads and writes, and being
explicit makes the intent auditable.

**No `.eq("user_id", ...)` in the application queries.** See `lib/data.ts`. The
policy does the filtering. Adding a redundant filter in the app would mask a
broken policy — the app would look correct while the database was open. If a
query here ever returns somebody else's row, that should be loud.

**No view over `sets` and no `security definer` function returning sets.** Both
are ways RLS gets bypassed by accident: a view runs as its owner, so a view owned
by `postgres` would read straight through the policy.

---

## Both graded tests, so they can be re-run

### 1. The database check, with nobody logged in

```bash
npm run verify:rls
```

Talks to PostgREST with the publishable key and no session, and asserts that an
anonymous caller can neither read a row nor insert one. Exits non-zero if either
is possible. Plain JavaScript with no dependencies, so it runs with nothing but
Node installed.

Expected output:

```
  PASS  request with no API key is refused
        HTTP 401
  PASS  anonymous read returns zero rows
        HTTP 200, 0 row(s), body: []
  PASS  anonymous insert is refused
        HTTP 401, ... "new row violates row-level security policy for table \"sets\""
```

The insert check matters more than the read check: an empty table returns `[]`
whether or not a policy exists, but a rejected insert proves the policy is
actually being enforced.

### 2. The three-window check

1. **Normal window** — log in as account one. Add a set.
2. **Private window** — sign up as a second, completely different account.
3. **From account two** — try to reach account one's data: by URL, by row id, by
   search, by anything the interface exposes. Nothing comes back.

A logged-out request for any app route is redirected to `/login` by
`middleware.ts` before a page renders, so there is no flash of content and no
empty shell. That is the application half of the guard; the policy above is the
half that actually protects the data.

---

## Running it

```bash
npm install
npm run dev
```

Needs `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable key>
```

Both are public-by-design values and are also set in Vercel for all three
environments. The secret / service-role key is not used by this app and should
not be added.

**One Supabase setting is load-bearing:** Authentication → Providers → Email →
**Confirm email must be off**. The grading test signs up a second account and
uses it immediately; with confirmation on, that account cannot sign in until
someone clicks a link in an inbox.

---

## How it is put together

```
app/
  page.tsx                   public landing page
  login/, signup/            auth screens
  auth/actions.ts            sign up, log in, log out, set active routine
  (app)/
    layout.tsx               session guard + nav shell
    dashboard/               greeting, next workout, rolling 7-day stats
    log/                     session-grouped log, filter, add/edit sheet
    log/actions.ts           create, update, delete, load sample week
    progression/             per-lift estimated 1RM trend
    routines/                three routines, each day loggable in one tap
    me/                      stats, active routine, log out
components/                  ui primitives, set card, set sheet, SVG chart
lib/
  supabase/                  browser client, server client, session middleware
  progression.ts             Epley e1RM, PRs, session deltas, rolling 7 days
  routines.ts                the three routines, in code
  lifts.ts                   ~50 lift catalog and name normalisation
scripts/verify-rls.mjs       the 250-point check, as code
supabase/migrations/         the schema and policies above
```

### Decisions worth explaining

**Estimated 1RM, via Epley** — `weight × (1 + reps / 30)`. One number per set, so
a heavy triple and a long set of ten can be compared honestly. Top-set weight
alone would rank 100 kg × 2 above 95 kg × 8, which is the wrong way round.

**Routines live in code, not the database.** They are identical for every member,
so a table would add a migration, a policy, a seed step and a query for data that
never changes.

**Display name and active routine live in user metadata**, not a `profiles`
table. One less table, and one less RLS policy to get wrong.

**Which routine day is due is derived, never stored.** The dashboard finds the
most recent set carrying the active routine's tag and offers the day after it.

**The add/edit sheet keeps its state in the URL.** That is what lets "log this
day" on a routine page be an ordinary link instead of state handed across a
navigation, and it makes a filtered log shareable. The trade-off is that Back
closes the sheet rather than leaving the page.

**The progression chart is hand-rolled SVG.** No chart dependency, so the accent
colour, the type and the grid match the rest of the app exactly, and there are no
library defaults to restyle away.

**"Load a sample week" is offered only from the empty state**, never run on
signup. A new account meets the real empty state first; filling it is a choice.
The sample rows are ordinary owned rows and can be deleted like any other.

---

## Tickets

| # | Ticket | Status |
|---|---|---|
| -2 | Columns on paper, shown to an instructor | see `docs/data-model.md` |
| -1 | New folder, repo, Vercel project, Supabase table, keys in Vercel | done |
| 0 | Sign up with email and password | done |
| 1 | Log in and log out | done |
| 2 | Land on a page that greets me by name | done |
| 3 | Add an item to my collection | done |
| 4 | My collection survives a refresh | done |
| 5 | I see only my own items | done |
| 6 | A stranger not logged in cannot get in at all | done |
| 7 | It looks like a product | done |
| 8 | Latest version live at my address, code on GitHub | done |
| 9 | Edit an item | done |
| 10 | Delete an item | done |
| 11 | Search or filter | done |
| 12 | See a count or a stat | done |
| 13 | Add a picture | not done — out of scope |
| 14 | Mark one item public | not done — see below |

**Why 13 and 14 were left out.** Ticket 14 is a trap the brief names itself: if a
row can be public, "only the owner can read it" stops being true, and the
anonymous check would legitimately return rows. Implementing it safely means
keeping `public.sets` owner-only forever and putting anything shareable in a
separate table with its own explicit anon-select policy. That is the right design
and it was scoped out rather than risk the 250 points on an ice-box feature.
Ticket 13 was dropped for time.
