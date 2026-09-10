"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeLiftName } from "@/lib/lifts";
import { formatSet } from "@/lib/format";
import type { ActionResult, RoutineSlug } from "@/lib/types";

const ROUTINE_SLUGS = new Set(["full-body-3", "upper-lower-4", "ppl-6"]);

/**
 * Logs one set from a session screen.
 *
 * Each set commits on its own as it is ticked, rather than everything being
 * held in the page until a Save button at the end. A set is a discrete event
 * that already happened, and losing a finished set because a phone locked or a
 * tab was closed mid-workout is a worse failure than an extra request.
 */
export async function logSessionSetAction(input: {
  lift: string;
  weight_kg: number;
  reps: number;
  rpe: number | null;
  routine_slug: string | null;
  routine_day: string | null;
  performed_on: string;
}): Promise<ActionResult> {
  const lift = normalizeLiftName(String(input.lift ?? ""));
  if (!lift) return { ok: false, error: "That set has no exercise on it." };
  if (lift.length > 60) return { ok: false, error: "That lift name is too long." };

  const weight = Number(input.weight_kg);
  if (!Number.isFinite(weight) || weight < 0 || weight > 999) {
    return { ok: false, error: "Weight must be between 0 and 999 kg." };
  }

  const reps = Number(input.reps);
  if (!Number.isInteger(reps) || reps < 1 || reps > 100) {
    return { ok: false, error: "Reps must be a whole number from 1 to 100." };
  }

  let rpe: number | null = null;
  if (input.rpe !== null && input.rpe !== undefined) {
    const parsed = Number(input.rpe);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 10) {
      return { ok: false, error: "RPE runs from 1 to 10." };
    }
    rpe = parsed;
  }

  const performedOn = String(input.performed_on ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(performedOn)) {
    return { ok: false, error: "That date is not valid." };
  }

  const slug = String(input.routine_slug ?? "");
  const routineSlug = ROUTINE_SLUGS.has(slug) ? (slug as RoutineSlug) : null;
  const routineDay = routineSlug
    ? String(input.routine_day ?? "").slice(0, 40) || null
    : null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sets")
    .insert({
      lift,
      weight_kg: weight,
      reps,
      rpe,
      performed_on: performedOn,
      routine_slug: routineSlug,
      routine_day: routineDay,
      note: null,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/log");
  revalidatePath("/dashboard");
  revalidatePath("/progression");

  return {
    ok: true,
    message: `${lift}, ${formatSet({ weight_kg: weight, reps })} logged.`,
    highlightId: data.id as string,
  };
}

/** Undo a set logged by mistake during a session. */
export async function undoSessionSetAction(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Nothing to undo." };

  const supabase = await createClient();
  const { error } = await supabase.from("sets").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/log");
  revalidatePath("/dashboard");
  revalidatePath("/progression");
  return { ok: true, message: "Set removed." };
}
