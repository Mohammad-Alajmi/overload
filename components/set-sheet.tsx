"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input, NumberInput, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { createSetAction, updateSetAction } from "@/app/(app)/log/actions";
import type { ActionResult, LiftSet } from "@/lib/types";
import { formatWeight } from "@/lib/format";

/**
 * The add / edit sheet. Its open state lives entirely in the URL, which is what
 * lets "log this day" on a routine page be an ordinary link rather than state
 * handed across a navigation. The trade-off is that Back closes the sheet
 * instead of leaving the page — which is the behaviour you want anyway.
 */
export function SetSheet({
  suggestions,
  editing,
  today,
  prefill,
  lastTime,
}: {
  suggestions: string[];
  editing: LiftSet | null;
  today: string;
  prefill: { lift?: string; routine?: string; day?: string };
  /** What this lift was last time, shown as the number to beat. */
  lastTime: string | null;
}) {
  const router = useRouter();
  const { show } = useToast();
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(editing ? updateSetAction : createSetAction, null);

  const handled = useRef<ActionResult | null>(null);

  useEffect(() => {
    if (!state || handled.current === state) return;
    handled.current = state;

    if (state.ok) {
      show(state.message);
      // Land back on the log with the saved row flagged, so it flashes in.
      router.replace(
        state.highlightId ? `/log?saved=${state.highlightId}` : "/log",
      );
    } else {
      show(state.error, "error");
    }
  }, [state, show, router]);

  const close = () => router.replace("/log");
  const fieldError = (name: string) =>
    state && !state.ok ? state.fieldErrors?.[name] : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        onClick={close}
        className="absolute inset-0 bg-ground/80 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={editing ? "Edit set" : "Add a set"}
        className="relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-line bg-surface p-5 sm:rounded-2xl"
        style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              {editing ? "Edit set" : "Add a set"}
            </h2>
            {prefill.day ? (
              <p className="label mt-1">{prefill.day}</p>
            ) : lastTime ? (
              <p className="mt-1 text-xs text-muted">
                Last time:{" "}
                <span className="nums text-accent">{lastTime}</span>
              </p>
            ) : null}
          </div>
          <Button variant="ghost" size="sm" onClick={close} type="button">
            Cancel
          </Button>
        </div>

        <form action={formAction} className="space-y-4">
          {editing ? (
            <input type="hidden" name="id" value={editing.id} />
          ) : null}
          <input
            type="hidden"
            name="routine_slug"
            value={editing?.routine_slug ?? prefill.routine ?? ""}
          />
          <input
            type="hidden"
            name="routine_day"
            value={editing?.routine_day ?? prefill.day ?? ""}
          />

          <Field label="Lift" error={fieldError("lift")}>
            <Input
              name="lift"
              list="lift-suggestions"
              required
              maxLength={60}
              autoFocus={!editing}
              defaultValue={editing?.lift ?? prefill.lift ?? ""}
              placeholder="Bench press"
              autoComplete="off"
            />
            <datalist id="lift-suggestions">
              {suggestions.map((lift) => (
                <option key={lift} value={lift} />
              ))}
            </datalist>
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Weight kg" error={fieldError("weight_kg")}>
              <NumberInput
                name="weight_kg"
                step="0.5"
                min="0"
                max="999"
                required
                defaultValue={
                  editing ? formatWeight(editing.weight_kg) : undefined
                }
                placeholder="92.5"
              />
            </Field>
            <Field label="Reps" error={fieldError("reps")}>
              <NumberInput
                name="reps"
                step="1"
                min="1"
                max="100"
                required
                defaultValue={editing?.reps ?? undefined}
                placeholder="5"
              />
            </Field>
            <Field label="RPE" error={fieldError("rpe")} hint="Optional">
              <NumberInput
                name="rpe"
                step="0.5"
                min="1"
                max="10"
                defaultValue={editing?.rpe ?? undefined}
                placeholder="8"
              />
            </Field>
          </div>

          <Field label="Day" error={fieldError("performed_on")}>
            <Input
              name="performed_on"
              type="date"
              required
              className="nums"
              defaultValue={editing?.performed_on ?? today}
            />
          </Field>

          <Field label="Note" hint="Optional" error={fieldError("note")}>
            <Textarea
              name="note"
              maxLength={280}
              defaultValue={editing?.note ?? ""}
              placeholder="Felt heavy off the chest."
            />
          </Field>

          <Button type="submit" disabled={pending} className="w-full">
            {pending
              ? "Saving…"
              : editing
                ? "Save changes"
                : "Save set"}
          </Button>
        </form>
      </div>
    </div>
  );
}
