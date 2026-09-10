import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getRoutine, DEFAULT_ROUTINE } from "@/lib/routines";
import { getUser } from "@/lib/supabase/server";
import { getSets } from "@/lib/data";
import { setActiveRoutineAction } from "@/app/auth/actions";
import { addSetHref } from "@/lib/links";
import { formatDay, formatSet } from "@/lib/format";
import { Button, ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const routine = getRoutine(slug);
  return { title: routine ? routine.name : "Routine" };
}

export default async function RoutinePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ day?: string }>;
}) {
  const { slug } = await params;
  const { day: requestedDay } = await searchParams;

  const routine = getRoutine(slug);
  if (!routine) notFound();

  const user = await getUser();
  const activeSlug =
    (user?.user_metadata?.active_routine as string | undefined) ??
    DEFAULT_ROUTINE;
  const isActive = routine.slug === activeSlug;

  const sets = await getSets();
  const selected =
    routine.days.find((d) => d.name === requestedDay) ?? routine.days[0];

  /** Most recent logged set for a lift, so each row can show a target to beat. */
  const lastFor = (lift: string) => sets.find((s) => s.lift === lift) ?? null;

  return (
    <>
      <Link
        href="/routines"
        className="mb-4 inline-block text-sm text-muted hover:text-accent"
      >
        ← Routines
      </Link>

      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {routine.name}
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            {routine.daysPerWeek} days a week · {routine.suits}
          </p>
        </div>
        {isActive ? (
          <span
            className="label shrink-0"
            style={{ color: "var(--color-accent)" }}
          >
            Active
          </span>
        ) : (
          <form action={setActiveRoutineAction} className="shrink-0">
            <input type="hidden" name="routine" value={routine.slug} />
            <Button type="submit" variant="secondary" size="sm">
              Make active
            </Button>
          </form>
        )}
      </div>

      {/* The week, as a grid of days. */}
      <nav className="mb-5 -mx-5 overflow-x-auto px-5">
        <ul className="flex gap-2 pb-1">
          {routine.days.map((day) => (
            <li key={day.name}>
              <Link
                href={`/routines/${routine.slug}?day=${encodeURIComponent(day.name)}`}
                aria-current={day.name === selected.name ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center whitespace-nowrap rounded-lg border px-3 text-sm transition-colors",
                  day.name === selected.name
                    ? "border-accent/40 bg-accent-dim/50 font-medium text-accent"
                    : "border-line bg-surface text-muted hover:text-ink",
                )}
              >
                {day.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section className="rounded-xl border border-line bg-surface">
        <header className="border-b border-line px-4 py-3">
          <h2 className="text-sm font-medium">{selected.name}</h2>
          <p className="label mt-0.5">{selected.focus}</p>
        </header>

        <ul className="divide-y divide-line">
          {selected.lifts.map((item) => {
            const last = lastFor(item.lift);
            return (
              <li
                key={item.lift}
                className="flex items-center gap-3 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{item.lift}</p>
                  <p className="mt-0.5 text-xs text-faint">
                    {last ? (
                      <>
                        Last:{" "}
                        <span className="nums">{formatSet(last)}</span> ·{" "}
                        {formatDay(last.performed_on)}
                      </>
                    ) : (
                      "Not logged yet"
                    )}
                  </p>
                </div>
                <p className="nums shrink-0 text-sm text-muted">
                  {item.sets}×{item.reps}
                </p>
                {/* Prefill is just a link, because the sheet reads the URL. */}
                <ButtonLink
                  href={addSetHref({
                    lift: item.lift,
                    routine: routine.slug,
                    day: selected.name,
                  })}
                  variant="secondary"
                  size="sm"
                  className="shrink-0"
                >
                  Log
                </ButtonLink>
              </li>
            );
          })}
        </ul>

        <footer className="border-t border-line p-3">
          <ButtonLink
            href={addSetHref({ routine: routine.slug, day: selected.name })}
            className="w-full"
          >
            Log {selected.name}
          </ButtonLink>
        </footer>
      </section>
    </>
  );
}
