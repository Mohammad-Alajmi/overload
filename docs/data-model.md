# Overload — columns on paper

**Ticket -2.** One page, to be shown to an instructor before writing code.
Student: Mohammad Aljry.

---

## What the app is

A gym set tracker. A member logs one row per set: the lift, the weight, the reps,
and the day. From those rows the app works out an estimated one-rep max per lift
and shows whether it is going up.

**One member has many sets. That is the whole data model.** There is no second
entity, because there does not need to be one.

---

## The one table: `public.sets`

| Column | Type | Null? | Why it exists |
|---|---|---|---|
| `id` | `uuid` | no | Primary key, `gen_random_uuid()` |
| `user_id` | `uuid` | no | Owner. Defaults to `auth.uid()`, references `auth.users`, cascades on delete. **This is the column the whole security model rests on.** |
| `lift` | `text` | no | Lift name, 1–60 chars, trimmed |
| `weight_kg` | `numeric(6,2)` | no | 0–999. Two decimals because plates go to 1.25 kg |
| `reps` | `integer` | no | 1–100, whole numbers |
| `rpe` | `numeric(3,1)` | **yes** | 1–10 how hard it felt. Optional because not everyone tracks it |
| `performed_on` | `date` | no | The day. A **date**, not a timestamp — a set belongs to a training day, not to a moment |
| `routine_slug` | `text` | **yes** | Which routine this came from, if any. Constrained to the three known slugs |
| `routine_day` | `text` | **yes** | e.g. "Upper A". Lets the dashboard work out which day is due next |
| `note` | `text` | **yes** | Up to 280 chars |
| `created_at` | `timestamptz` | no | Insert order, for sorting within a day |

### Things I decided on purpose

- **`performed_on` is a `date`.** If it were a timestamp, "what did I do
  yesterday" becomes a timezone question. It should not be.
- **`rpe` is nullable.** Making it required would force a number people do not
  always know.
- **Multiple sets of the same lift on the same day are separate rows.** 5×5 is
  five rows, not one row with a count. Each set can carry its own weight and RPE.
- **No `routines` table.** The three routines are identical for every member and
  never change, so they live in code. A table would mean another migration,
  another security policy, and a seed step for no benefit.
- **No `profiles` table.** The display name goes in Supabase user metadata. One
  less table, one less policy to get wrong.

### Indexes

- `(user_id, performed_on desc)` — the log screen's query
- `(user_id, lift)` — the progression screen's query

---

## Security, in one line

Row Level Security on, four policies, every one of them
`to authenticated using (auth.uid() = user_id)`.

Nothing is granted to the anonymous role, so an anonymous caller matches no
policy and reads zero rows. **The filtering is in the database, not in the
page** — `lib/data.ts` deliberately contains no `where user_id = ...`, because a
redundant filter there would hide a broken policy.

---

## Screens, and how a member moves between them

```
   ┌──────────────┐
   │   /  landing │  a stranger: what it is, sign up / log in
   └──────┬───────┘
          │ sign up / log in
          ▼
   ┌──────────────────────────────────────────────┐
   │  /dashboard    "Hello, Mohammad."            │
   │  next workout from the active routine ───────┼──┐
   │  rolling 7-day stats, last session           │  │
   └──────────────────────────────────────────────┘  │
                                                     │
   ┌─────────────┬──────────────┬─────────────┬──────▼──────┐
   │  /log       │ /progression │ /routines   │  /me        │
   │  sessions   │ e1RM chart   │ 3 routines  │  stats      │
   │  grouped    │ PR + delta   │ each day    │  active     │
   │  by day     │ per lift     │ loggable    │  routine    │
   │             │              │             │  log out    │
   │  + add/edit │              │  "Log this" │             │
   │    sheet ◄──┼──────────────┼─────────────┘             │
   │    (in URL) │              │                           │
   └─────────────┴──────────────┴───────────────────────────┘
```

Bottom tab bar on a phone, top nav on desktop. The add/edit sheet keeps its
state in the URL, which is what makes "log this day" from a routine an ordinary
link.

---

## What I expect to be hard

1. **Ticket 5 and 6 are two different tests.** One is "another member cannot see
   my rows", the other is "an anonymous database query returns nothing". Passing
   the first with a query filter would still fail the second. So the policy gets
   written and verified before any interface exists.
2. **Ticket 14, if I get to it.** A public row makes "only the owner can read it"
   false. The safe shape is to keep `sets` owner-only forever and put anything
   shareable in a separate table.
3. **Email confirmation.** If it is left on, signing up a second account in a
   private window cannot log in without an inbox — which is exactly what the
   grading test does.
