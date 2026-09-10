import { createClient } from "./supabase/server";
import type { LiftSet, Profile } from "./types";

/**
 * Every set the signed-in member owns, newest first.
 *
 * Note the absence of `.eq("user_id", user.id)`. That is deliberate: the RLS
 * policy is what restricts these rows, and adding a filter here would mask a
 * broken policy — the query would look correct in the app while the database
 * stayed wide open. If this ever returns somebody else's row, the policy is
 * wrong and it should be loud, not quietly filtered away.
 */
export async function getSets(): Promise<LiftSet[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sets")
    .select("*")
    .order("performed_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Could not load your sets: ${error.message}`);
  return (data ?? []) as LiftSet[];
}

export async function getSet(id: string): Promise<LiftSet | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sets")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Could not load that set: ${error.message}`);
  return (data as LiftSet | null) ?? null;
}

/** The signed-in member's profile. Same reasoning as above: no owner filter. */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .maybeSingle();

  if (error) throw new Error(`Could not load your profile: ${error.message}`);
  return (data as Profile | null) ?? null;
}

/**
 * The most recent set for each of the named lifts, so a session can open with
 * last time's numbers already in the boxes. One query for the whole workout
 * rather than one per exercise — this is what sets_user_lift_recent_idx is for.
 */
export async function getLastSetPerLift(
  lifts: string[],
): Promise<Record<string, LiftSet>> {
  if (lifts.length === 0) return {};

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sets")
    .select("*")
    .in("lift", lifts)
    .order("performed_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Could not load your history: ${error.message}`);

  const latest: Record<string, LiftSet> = {};
  for (const row of (data ?? []) as LiftSet[]) {
    // Rows arrive newest first, so the first one seen for a lift is the one.
    if (!latest[row.lift]) latest[row.lift] = row;
  }
  return latest;
}
