import type { LiftSet } from "./types";

/** 92.50 -> "92.5", 100.00 -> "100". Trailing zeros make a log look unfinished. */
export function formatWeight(kg: number): string {
  return Number(kg)
    .toFixed(2)
    .replace(/\.?0+$/, "");
}

/** The canonical way a set reads anywhere in the app: "92.5 kg × 5". */
export function formatSet(set: Pick<LiftSet, "weight_kg" | "reps">): string {
  return `${formatWeight(set.weight_kg)} kg × ${set.reps}`;
}

export function formatE1rm(kg: number): string {
  return `${Math.round(kg * 10) / 10} kg`;
}

/**
 * `performed_on` is a plain date. Parsing it with `new Date("2026-09-10")` would
 * read it as UTC midnight and shift the day backwards for anyone west of UTC, so
 * split it and build a local date instead.
 */
export function parseDay(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function daysAgoISO(days: number): string {
  const now = new Date();
  now.setDate(now.getDate() - days);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** "Today", "Yesterday", else "Mon 8 Sep". */
export function formatDay(iso: string): string {
  if (iso === todayISO()) return "Today";
  if (iso === daysAgoISO(1)) return "Yesterday";
  const date = parseDay(iso);
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatDayFull(iso: string): string {
  return parseDay(iso).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** "+2.5 kg" / "−1.2 kg" / "level". Uses a real minus sign, not a hyphen. */
export function formatDelta(kg: number): string {
  const rounded = Math.round(kg * 10) / 10;
  if (rounded === 0) return "level";
  const sign = rounded > 0 ? "+" : "−";
  return `${sign}${Math.abs(rounded)} kg`;
}

export function formatTonnage(kg: number): string {
  if (kg >= 1000) return `${Math.round(kg / 100) / 10}t`;
  return `${Math.round(kg)} kg`;
}
