import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getRoutine, getRoutineDay, DEFAULT_ROUTINE } from "@/lib/routines";
import { getLastSetPerLift, getProfile } from "@/lib/data";
import { todayISO, formatDayFull } from "@/lib/format";
import { SessionExercise } from "@/components/session-exercise";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Session" };

export default async function SessionPage({
  searchParams,
}: {
  searchParams: Promise<{ routine?: string; day?: string; date?: string }>;
}) {
  const params = await searchParams;
  const profile = await getProfile();

  const slug = params.routine ?? profile?.active_routine ?? DEFAULT_ROUTINE;
  const routine = getRoutine(slug);
  if (!routine) redirect("/routines");

  const day = getRoutineDay(slug, params.day) ?? routine.days[0];
  const performedOn = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? "")
    ? (params.date as string)
    : todayISO();

  // One query for the whole workout's history, not one per exercise.
  const lastByLift = await getLastSetPerLift(day.lifts.map((l) => l.lift));

  const totalSets = day.lifts.reduce((sum, l) => sum + l.sets, 0);

  return (
    <>
      <Link
        href={`/routines/${routine.slug}?day=${encodeURIComponent(day.name)}`}
        className="mb-4 inline-block text-sm text-muted hover:text-accent"
      >
        ← {routine.name}
      </Link>

      <header className="mb-5">
        <p className="label">{formatDayFull(performedOn)}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {day.name}
        </h1>
        <p className="mt-0.5 text-sm text-muted">
          {day.focus} ·{" "}
          <span className="nums">
            {day.lifts.length} exercises, {totalSets} sets
          </span>
        </p>
        <p className="mt-3 rounded-lg border border-line bg-surface px-3 py-2 text-xs leading-relaxed text-muted">
          Every set opens with last time&rsquo;s weight already in the box. Type
          what you actually lifted and tick it — the rest timer starts itself.
          Tap a timer to change its length, then drag sideways.
        </p>
      </header>

      <div className="space-y-4">
        {day.lifts.map((item) => (
          <SessionExercise
            key={item.lift}
            lift={item.lift}
            targetSets={item.sets}
            targetReps={item.reps}
            last={lastByLift[item.lift] ?? null}
            routineSlug={routine.slug}
            routineDay={day.name}
            performedOn={performedOn}
            restDefault={profile?.rest_seconds ?? 90}
          />
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <ButtonLink href="/log">Finish and see the log</ButtonLink>
        <ButtonLink href="/dashboard" variant="secondary">
          Back to today
        </ButtonLink>
      </div>
    </>
  );
}
