"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeLiftName } from "@/lib/lifts";
import { formatSet } from "@/lib/format";
import type { ActionResult, RoutineSlug, SetInput } from "@/lib/types";

const ROUTINE_SLUGS = new Set(["full-body-3", "upper-lower-4", "ppl-6"]);

function revalidateEverywhere() {
  revalidatePath("/log");
  revalidatePath("/dashboard");
  revalidatePath("/progression");
}

/**
 * Server-side validation. The client validates too, and the database has CHECK
 * constraints behind both — but a form can be submitted without a browser, so
 * this is the layer that actually has to hold.
 */
function parseSet(formData: FormData):
  | { ok: true; value: SetInput }
  | { ok: false; result: ActionResult } {
  const fieldErrors: Record<string, string> = {};

  const lift = normalizeLiftName(String(formData.get("lift") ?? ""));
  if (!lift) fieldErrors.lift = "Which lift was it?";
  if (lift.length > 60) fieldErrors.lift = "That name is too long.";

  const weight = Number(formData.get("weight_kg"));
  if (!Number.isFinite(weight) || weight < 0 || weight > 999) {
    fieldErrors.weight_kg = "Weight must be between 0 and 999 kg.";
  }

  const reps = Number(formData.get("reps"));
  if (!Number.isInteger(reps) || reps < 1 || reps > 100) {
    fieldErrors.reps = "Reps must be a whole number from 1 to 100.";
  }

  const rpeRaw = String(formData.get("rpe") ?? "").trim();
  let rpe: number | null = null;
  if (rpeRaw !== "") {
    const parsed = Number(rpeRaw);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 10) {
      fieldErrors.rpe = "RPE runs from 1 to 10.";
    } else {
      rpe = parsed;
    }
  }

  const performedOn = String(formData.get("performed_on") ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(performedOn)) {
    fieldErrors.performed_on = "Pick a date.";
  }

  const noteRaw = String(formData.get("note") ?? "").trim();
  if (noteRaw.length > 280) fieldErrors.note = "Notes cap out at 280 characters.";

  const slugRaw = String(formData.get("routine_slug") ?? "").trim();
  const routineSlug = ROUTINE_SLUGS.has(slugRaw)
    ? (slugRaw as RoutineSlug)
    : null;
  const routineDayRaw = String(formData.get("routine_day") ?? "").trim();

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      result: { ok: false, error: "Check the highlighted fields.", fieldErrors },
    };
  }

  return {
    ok: true,
    value: {
      lift,
      weight_kg: weight,
      reps,
      rpe,
      performed_on: performedOn,
      routine_slug: routineSlug,
      routine_day: routineSlug && routineDayRaw ? routineDayRaw : null,
      note: noteRaw || null,
    },
  };
}

export async function createSetAction(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseSet(formData);
  if (!parsed.ok) return parsed.result;

  const supabase = await createClient();
  // user_id is omitted on purpose: the column defaults to auth.uid(), so a
  // client cannot claim to be somebody else even if it tries.
  const { data, error } = await supabase
    .from("sets")
    .insert(parsed.value)
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidateEverywhere();
  return {
    ok: true,
    message: `${parsed.value.lift}, ${formatSet(parsed.value)} logged.`,
    highlightId: data.id as string,
  };
}

export async function updateSetAction(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Which set are we editing?" };

  const parsed = parseSet(formData);
  if (!parsed.ok) return parsed.result;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sets")
    .update(parsed.value)
    .eq("id", id)
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidateEverywhere();
  return {
    ok: true,
    message: `Updated to ${parsed.value.lift}, ${formatSet(parsed.value)}.`,
    highlightId: data.id as string,
  };
}

export async function deleteSetAction(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Which set are we deleting?" };

  const supabase = await createClient();
  const { error } = await supabase.from("sets").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidateEverywhere();
  return { ok: true, message: "Set deleted." };
}

/**
 * The escape hatch from the empty state. A brand new account meets the real
 * empty state first — this is a deliberate choice a member makes, never a seed
 * that runs on signup. The rows are ordinary owned rows and can be deleted like
 * any other.
 */
export async function loadSampleWeekAction(): Promise<ActionResult> {
  const supabase = await createClient();

  const day = (ago: number) => {
    const d = new Date();
    d.setDate(d.getDate() - ago);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
  };

  const session = (
    ago: number,
    routineDay: string,
    lifts: [string, number, number, number][],
  ) =>
    lifts.map(([lift, weight_kg, reps, rpe]) => ({
      lift,
      weight_kg,
      reps,
      rpe,
      performed_on: day(ago),
      routine_slug: "upper-lower-4" as RoutineSlug,
      routine_day: routineDay,
      note: null,
    }));

  // Two Upper A and two Lower A sessions, with the main lifts creeping up, so
  // the progression chart has an actual line rather than a single dot.
  const rows = [
    ...session(9, "Upper A", [
      ["Bench press", 87.5, 5, 8],
      ["Barbell row", 75, 8, 7],
      ["Seated dumbbell press", 22.5, 10, 8],
      ["Triceps pushdown", 30, 12, 8],
    ]),
    ...session(7, "Lower A", [
      ["Back squat", 110, 5, 8],
      ["Romanian deadlift", 90, 8, 7],
      ["Leg press", 160, 12, 8],
      ["Standing calf raise", 60, 15, 8],
    ]),
    ...session(4, "Upper A", [
      ["Bench press", 90, 5, 8.5],
      ["Barbell row", 77.5, 8, 7.5],
      ["Seated dumbbell press", 24, 10, 8],
      ["Barbell curl", 35, 12, 8],
    ]),
    ...session(2, "Lower A", [
      ["Back squat", 112.5, 5, 8.5],
      ["Romanian deadlift", 92.5, 8, 8],
      ["Leg curl", 45, 12, 8],
      ["Standing calf raise", 62.5, 15, 8],
    ]),
  ];

  const { error } = await supabase.from("sets").insert(rows);
  if (error) return { ok: false, error: error.message };

  revalidateEverywhere();
  return { ok: true, message: `${rows.length} sample sets added across 4 sessions.` };
}
