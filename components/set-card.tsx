import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatDay, formatSet, formatWeight } from "@/lib/format";
import { isPr } from "@/lib/progression";
import { editSetHref, liftHref } from "@/lib/links";
import { DeleteSetButton } from "@/components/delete-set-button";
import type { LiftSet } from "@/lib/types";

/**
 * One training day. Grouping by session rather than listing flat rows is what
 * makes this read like a training log instead of a spreadsheet — and it answers
 * the question people actually have, which is "what did I do last time".
 */
export function SetCard({
  day,
  sets,
  allSets,
  savedId,
}: {
  day: string;
  sets: LiftSet[];
  allSets: LiftSet[];
  savedId?: string;
}) {
  const routineDay = sets.find((s) => s.routine_day)?.routine_day;
  const tonnage = sets.reduce((sum, s) => sum + s.weight_kg * s.reps, 0);

  return (
    <section className="rounded-xl border border-line bg-surface">
      <header className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-medium">{formatDay(day)}</h2>
          {routineDay ? <p className="label mt-0.5">{routineDay}</p> : null}
        </div>
        <p className="nums shrink-0 text-xs text-faint">
          {sets.length} {sets.length === 1 ? "set" : "sets"} ·{" "}
          {formatWeight(tonnage)} kg
        </p>
      </header>

      <ul className="divide-y divide-line">
        {sets.map((set) => {
          const pr = isPr(allSets, set);
          return (
            <li
              key={set.id}
              className={cn(
                "flex items-center gap-2 px-2 py-2 sm:px-4",
                savedId === set.id && "flash",
              )}
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={liftHref(set.lift)}
                  className="block truncate text-sm hover:text-accent"
                >
                  {set.lift}
                </Link>
                {set.note ? (
                  <p className="mt-0.5 truncate text-xs text-faint">
                    {set.note}
                  </p>
                ) : null}
              </div>

              <p className="nums shrink-0 text-sm">{formatSet(set)}</p>

              <p className="nums w-8 shrink-0 text-right text-xs text-faint">
                {set.rpe ? formatWeight(set.rpe) : "—"}
              </p>

              {pr ? (
                <span
                  title="Best estimated 1RM for this lift"
                  className="label shrink-0"
                  style={{ color: "var(--color-accent)" }}
                >
                  PR
                </span>
              ) : (
                <span className="w-6 shrink-0" />
              )}

              <Link
                href={editSetHref(set.id)}
                aria-label={`Edit ${set.lift}`}
                className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-faint transition-colors hover:bg-raised hover:text-ink"
              >
                <span aria-hidden>✎</span>
              </Link>

              <DeleteSetButton
                id={set.id}
                label={`${set.lift}, ${formatSet(set)}`}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
