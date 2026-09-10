export type RoutineSlug = "full-body-3" | "upper-lower-4" | "ppl-6";

/**
 * One row of public.profiles. Created by a trigger the moment an account is
 * created, so a signed-in member always has one.
 */
export type Profile = {
  id: string;
  email: string;
  display_name: string;
  active_routine: RoutineSlug;
  /** Default rest between sets, in seconds. */
  rest_seconds: number;
  created_at: string;
  updated_at: string;
};

/** One row of public.sets. Mirrors the migration exactly. */
export type LiftSet = {
  id: string;
  user_id: string;
  lift: string;
  weight_kg: number;
  reps: number;
  rpe: number | null;
  /** Date only, `yyyy-mm-dd`. Never a timestamp — a set belongs to a day. */
  performed_on: string;
  routine_slug: RoutineSlug | null;
  routine_day: string | null;
  note: string | null;
  created_at: string;
};

/** What a member supplies. user_id is never sent: the column defaults to auth.uid(). */
export type SetInput = {
  lift: string;
  weight_kg: number;
  reps: number;
  rpe: number | null;
  performed_on: string;
  routine_slug: RoutineSlug | null;
  routine_day: string | null;
  note: string | null;
};

/** Shape returned by every Server Action, so the UI can report what happened. */
export type ActionResult =
  | { ok: true; message: string; highlightId?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };
