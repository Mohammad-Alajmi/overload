import type { LiftSet } from "./types";
import { daysAgoISO } from "./format";

/**
 * Epley estimated one-rep max. This is the single number the whole progression
 * view rests on: it lets 5 × 100 kg and 8 × 92.5 kg be compared honestly, which
 * raw top-set weight cannot do.
 */
export function e1rm(weightKg: number, reps: number): number {
  return weightKg * (1 + reps / 30);
}

export function setE1rm(set: Pick<LiftSet, "weight_kg" | "reps">): number {
  return e1rm(set.weight_kg, set.reps);
}

/** Lift names a member has actually used, most frequent first. */
export function ownLifts(sets: LiftSet[]): string[] {
  const counts = new Map<string, number>();
  for (const s of sets) counts.set(s.lift, (counts.get(s.lift) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([lift]) => lift);
}

/** Group sets into days, newest day first, and newest-entered first within a day. */
export function bySession(sets: LiftSet[]): { day: string; sets: LiftSet[] }[] {
  const days = new Map<string, LiftSet[]>();
  for (const s of sets) {
    const bucket = days.get(s.performed_on);
    if (bucket) bucket.push(s);
    else days.set(s.performed_on, [s]);
  }
  return [...days.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([day, daySets]) => ({
      day,
      sets: daySets.sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
    }));
}

/** One point per session for one lift: the best estimated 1RM that day. */
export function liftTrend(
  sets: LiftSet[],
  lift: string,
): { day: string; e1rm: number; best: LiftSet }[] {
  const byDay = new Map<string, LiftSet>();
  for (const s of sets) {
    if (s.lift !== lift) continue;
    const current = byDay.get(s.performed_on);
    if (!current || setE1rm(s) > setE1rm(current)) byDay.set(s.performed_on, s);
  }
  return [...byDay.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([day, best]) => ({ day, e1rm: setE1rm(best), best }));
}

/** Best estimated 1RM ever recorded for a lift. */
export function prFor(sets: LiftSet[], lift: string): LiftSet | null {
  let best: LiftSet | null = null;
  for (const s of sets) {
    if (s.lift !== lift) continue;
    if (!best || setE1rm(s) > setE1rm(best)) best = s;
  }
  return best;
}

/**
 * Change in best estimated 1RM between the two most recent sessions of a lift.
 * null when there is nothing to compare against yet — one session is not a trend.
 */
export function sessionDelta(sets: LiftSet[], lift: string): number | null {
  const trend = liftTrend(sets, lift);
  if (trend.length < 2) return null;
  return trend[trend.length - 1].e1rm - trend[trend.length - 2].e1rm;
}

/** True when this set is the best estimated 1RM the member has ever done for the lift. */
export function isPr(sets: LiftSet[], set: LiftSet): boolean {
  const best = prFor(sets, set.lift);
  return best?.id === set.id;
}

/** Rolling last 7 days, so the numbers never reset to zero overnight. */
export function rolling7(sets: LiftSet[]): {
  setCount: number;
  tonnage: number;
  sessions: number;
  lifts: number;
} {
  const cutoff = daysAgoISO(6);
  const recent = sets.filter((s) => s.performed_on >= cutoff);
  return {
    setCount: recent.length,
    tonnage: recent.reduce((sum, s) => sum + s.weight_kg * s.reps, 0),
    sessions: new Set(recent.map((s) => s.performed_on)).size,
    lifts: new Set(recent.map((s) => s.lift)).size,
  };
}
