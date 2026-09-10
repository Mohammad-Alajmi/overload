"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { formatDay, formatSet, formatWeight } from "@/lib/format";
import { NumberInput } from "@/components/ui/field";
import { RestTimer } from "@/components/rest-timer";
import { useToast } from "@/components/ui/toast";
import {
  logSessionSetAction,
  undoSessionSetAction,
} from "@/app/(app)/session/actions";
import type { LiftSet } from "@/lib/types";

type Row = {
  weight: string;
  reps: string;
  loggedId: string | null;
};

/** "8-12" -> 8, "5" -> 5, "30-60s" -> 30. Falls back to 8. */
function firstNumber(target: string): number {
  const match = /\d+/.exec(target);
  const n = match ? Number(match[0]) : 8;
  return n >= 1 && n <= 100 ? n : 8;
}

/**
 * One exercise in a session: every prescribed set stacked as its own row, each
 * opening with last time's weight already in the box — or 0 when the exercise
 * has never been logged. So the whole job is typing a number and ticking.
 */
export function SessionExercise({
  lift,
  targetSets,
  targetReps,
  last,
  routineSlug,
  routineDay,
  performedOn,
  restDefault,
}: {
  lift: string;
  targetSets: number;
  targetReps: string;
  last: LiftSet | null;
  routineSlug: string;
  routineDay: string;
  performedOn: string;
  restDefault: number;
}) {
  const { show } = useToast();
  const [pending, startTransition] = useTransition();
  const [startToken, setStartToken] = useState(0);
  const [busyRow, setBusyRow] = useState<number | null>(null);

  const [rows, setRows] = useState<Row[]>(() =>
    Array.from({ length: targetSets }, () => ({
      // Never blank: last time's weight, or 0 for an exercise with no history.
      weight: last ? formatWeight(last.weight_kg) : "0",
      reps: String(last?.reps ?? firstNumber(targetReps)),
      loggedId: null,
    })),
  );

  const patch = (index: number, changes: Partial<Row>) =>
    setRows((current) =>
      current.map((row, i) => (i === index ? { ...row, ...changes } : row)),
    );

  const logRow = (index: number) => {
    const row = rows[index];
    setBusyRow(index);
    startTransition(async () => {
      const result = await logSessionSetAction({
        lift,
        weight_kg: Number(row.weight),
        reps: Number(row.reps),
        rpe: null,
        routine_slug: routineSlug,
        routine_day: routineDay,
        performed_on: performedOn,
      });
      setBusyRow(null);

      if (!result.ok) {
        show(result.error, "error");
        return;
      }

      patch(index, { loggedId: result.highlightId ?? null });
      show(result.message);
      // Ticking a set is what starts the clock — that is when rest begins.
      setStartToken((t) => t + 1);

      // Carry this weight down to the sets that are still to come, so a
      // mid-session change does not need retyping on every row.
      setRows((current) =>
        current.map((r, i) =>
          i > index && !r.loggedId
            ? { ...r, weight: row.weight, reps: row.reps }
            : r,
        ),
      );
    });
  };

  const undoRow = (index: number) => {
    const id = rows[index].loggedId;
    if (!id) return;
    setBusyRow(index);
    startTransition(async () => {
      const result = await undoSessionSetAction(id);
      setBusyRow(null);
      if (!result.ok) {
        show(result.error, "error");
        return;
      }
      patch(index, { loggedId: null });
      show(result.message);
    });
  };

  const doneCount = rows.filter((r) => r.loggedId).length;
  const allDone = doneCount === rows.length;

  return (
    <section
      className={cn(
        "rounded-xl border bg-surface transition-colors",
        allDone ? "border-accent/40" : "border-line",
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-medium">{lift}</h2>
          <p className="mt-0.5 text-xs text-faint">
            <span className="nums">
              {targetSets}×{targetReps}
            </span>
            {" · "}
            {last ? (
              <>
                last <span className="nums text-accent">{formatSet(last)}</span>{" "}
                on <span className="nums">{formatDay(last.performed_on)}</span>
              </>
            ) : (
              "never logged, starting from 0"
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="nums text-xs text-faint">
            {doneCount}/{rows.length}
          </span>
          <RestTimer
            liftKey={lift}
            defaultSeconds={restDefault}
            startToken={startToken}
          />
        </div>
      </header>

      <ol className="divide-y divide-line">
        {rows.map((row, index) => {
          const logged = Boolean(row.loggedId);
          const busy = busyRow === index && pending;
          return (
            <li
              key={index}
              className={cn(
                "flex items-center gap-2 px-3 py-2",
                logged && "bg-accent-dim/20",
              )}
            >
              <span className="label w-8 shrink-0 text-center">
                {index + 1}
              </span>

              {logged ? (
                <p className="nums flex-1 text-sm text-muted">
                  {formatWeight(Number(row.weight))} kg × {row.reps}
                </p>
              ) : (
                <div className="flex flex-1 items-center gap-2">
                  <label className="flex flex-1 items-center gap-1.5">
                    <span className="sr-only">
                      Weight in kilograms for set {index + 1}
                    </span>
                    <NumberInput
                      value={row.weight}
                      onChange={(e) => patch(index, { weight: e.target.value })}
                      step="0.5"
                      min="0"
                      max="999"
                      className="w-full text-center"
                    />
                    <span className="shrink-0 text-xs text-faint">kg</span>
                  </label>
                  <span aria-hidden className="text-faint">
                    ×
                  </span>
                  <label className="flex w-20 items-center gap-1.5">
                    <span className="sr-only">Reps for set {index + 1}</span>
                    <NumberInput
                      value={row.reps}
                      onChange={(e) => patch(index, { reps: e.target.value })}
                      step="1"
                      min="1"
                      max="100"
                      className="w-full text-center"
                    />
                  </label>
                </div>
              )}

              {logged ? (
                <button
                  type="button"
                  onClick={() => undoRow(index)}
                  disabled={busy}
                  className="min-h-11 shrink-0 rounded-lg px-2 text-xs text-faint hover:text-danger disabled:opacity-50"
                >
                  {busy ? "…" : "Undo"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => logRow(index)}
                  disabled={busy}
                  aria-label={`Log set ${index + 1} of ${lift}`}
                  className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg bg-raised text-muted transition-colors hover:bg-accent hover:text-accent-ink disabled:opacity-50"
                >
                  {busy ? "…" : <span aria-hidden>✓</span>}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
