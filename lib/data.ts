import { createClient } from "./supabase/server";
import type { LiftSet } from "./types";

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
