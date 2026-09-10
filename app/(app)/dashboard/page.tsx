import Link from "next/link";
import type { Metadata } from "next";
import { getUser, displayNameOf } from "@/lib/supabase/server";
import { getProfile, getSets } from "@/lib/data";
import { rolling7, bySession } from "@/lib/progression";
import {
  DEFAULT_ROUTINE,
  ROUTINES,
  getRoutine,
  nextWorkout,
} from "@/lib/routines";
import { addSetHref } from "@/lib/links";
import { formatDay, formatTonnage, todayISO } from "@/lib/format";
import { StatTile } from "@/components/ui/stat-tile";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { SampleWeekButton } from "@/components/sample-week-button";

export const metadata: Metadata = { title: "Today" };

export default async function DashboardPage() {
  const profile = await getProfile();
  // Fall back to auth metadata if a profile row is somehow missing, so the
  // greeting never renders as "Hello, undefined".
  const user = profile ? null : await getUser();
  const name =
    profile?.display_name ?? (user ? displayNameOf(user) : "there");

  const sets = await getSets();
  const week = rolling7(sets);

  const routine =
    getRoutine(profile?.active_routine ?? DEFAULT_ROUTINE) ?? ROUTINES[0];

  // Which day is due is derived, never stored: look at the most recent set that
  // carried this routine's tag and offer the one after it.
  const lastTagged = sets.find((s) => s.routine_slug === routine.slug);
  const due = nextWorkout(routine, lastTagged?.routine_day ?? null);

  const lastSession = bySession(sets)[0];

  return (
    <>
      <header className="mb-6">
        <p className="label">{formatDay(todayISO())}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Hello, {name}.
        </h1>
      </header>

      {/* The next workout is the point of this screen: it turns the dashboard
          into a starting point rather than a stats page. */}
      <section className="mb-5 rounded-xl border border-accent/30 bg-accent-dim/25 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="label">Next up · {routine.name}</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">
              {due.name}
            </h2>
            <p className="mt-0.5 text-sm text-muted">{due.focus}</p>
          </div>
          <ButtonLink
            href={`/session?routine=${routine.slug}&day=${encodeURIComponent(due.name)}`}
            size="sm"
            className="shrink-0"
          >
            Start
          </ButtonLink>
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-accent/20 pt-3">
          {due.lifts.map((item) => (
            <li key={item.lift} className="text-xs text-muted">
              {item.lift}{" "}
              <span className="nums text-faint">
                {item.sets}×{item.reps}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="label mb-2">Last 7 days</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Sets" value={String(week.setCount)} accent />
          <StatTile label="Tonnage" value={formatTonnage(week.tonnage)} />
          <StatTile label="Sessions" value={String(week.sessions)} />
          <StatTile label="Lifts" value={String(week.lifts)} />
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="label">Last session</h2>
          <Link href="/log" className="text-xs text-muted hover:text-accent">
            See the full log →
          </Link>
        </div>

        {!lastSession ? (
          <EmptyState
            title="No sets yet. Log your first lift."
            body="Once something is in here, this page will show what is due next and how your week is going."
            action={
              <>
                <ButtonLink href={addSetHref()}>Add your first set</ButtonLink>
                <SampleWeekButton />
              </>
            }
          />
        ) : (
          <div className="rounded-xl border border-line bg-surface p-4">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-medium">
                {formatDay(lastSession.day)}
              </p>
              <p className="nums text-xs text-faint">
                {lastSession.sets.length}{" "}
                {lastSession.sets.length === 1 ? "set" : "sets"}
              </p>
            </div>
            <ul className="mt-2 space-y-1">
              {lastSession.sets.slice(0, 4).map((set) => (
                <li
                  key={set.id}
                  className="flex items-baseline justify-between gap-3 text-sm"
                >
                  <span className="truncate text-muted">{set.lift}</span>
                  <span className="nums shrink-0">
                    {set.weight_kg} kg × {set.reps}
                  </span>
                </li>
              ))}
            </ul>
            {lastSession.sets.length > 4 ? (
              <p className="mt-2 text-xs text-faint">
                and {lastSession.sets.length - 4} more
              </p>
            ) : null}
          </div>
        )}
      </section>
    </>
  );
}
