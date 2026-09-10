/**
 * A starter catalog so a brand new account has something to pick from, and so
 * lift names stay consistent. Free text is still accepted everywhere — this
 * exists to stop "Bench Press" and "bench press" becoming two separate lines on
 * a progression chart, not to restrict anybody.
 *
 * Every lift named in lib/routines.ts appears here, spelled identically.
 */

export type LiftCategory =
  | "Squat"
  | "Hinge"
  | "Push"
  | "Pull"
  | "Arms"
  | "Legs"
  | "Core";

export type CatalogLift = { name: string; category: LiftCategory };

export const LIFTS: CatalogLift[] = [
  { name: "Back squat", category: "Squat" },
  { name: "Front squat", category: "Squat" },
  { name: "Hack squat", category: "Squat" },
  { name: "Leg press", category: "Squat" },
  { name: "Bulgarian split squat", category: "Squat" },
  { name: "Goblet squat", category: "Squat" },

  { name: "Deadlift", category: "Hinge" },
  { name: "Romanian deadlift", category: "Hinge" },
  { name: "Sumo deadlift", category: "Hinge" },
  { name: "Trap bar deadlift", category: "Hinge" },
  { name: "Hip thrust", category: "Hinge" },
  { name: "Back extension", category: "Hinge" },

  { name: "Bench press", category: "Push" },
  { name: "Incline bench press", category: "Push" },
  { name: "Close-grip bench press", category: "Push" },
  { name: "Dumbbell bench press", category: "Push" },
  { name: "Dumbbell incline press", category: "Push" },
  { name: "Machine chest press", category: "Push" },
  { name: "Cable fly", category: "Push" },
  { name: "Dip", category: "Push" },
  { name: "Push-up", category: "Push" },
  { name: "Overhead press", category: "Push" },
  { name: "Seated dumbbell press", category: "Push" },
  { name: "Arnold press", category: "Push" },
  { name: "Lateral raise", category: "Push" },
  { name: "Cable lateral raise", category: "Push" },

  { name: "Pull-up", category: "Pull" },
  { name: "Chin-up", category: "Pull" },
  { name: "Lat pulldown", category: "Pull" },
  { name: "Straight-arm pulldown", category: "Pull" },
  { name: "Barbell row", category: "Pull" },
  { name: "Dumbbell row", category: "Pull" },
  { name: "Seated cable row", category: "Pull" },
  { name: "Chest-supported row", category: "Pull" },
  { name: "Face pull", category: "Pull" },
  { name: "Shrug", category: "Pull" },

  { name: "Barbell curl", category: "Arms" },
  { name: "Dumbbell curl", category: "Arms" },
  { name: "Hammer curl", category: "Arms" },
  { name: "Preacher curl", category: "Arms" },
  { name: "Triceps pushdown", category: "Arms" },
  { name: "Overhead triceps extension", category: "Arms" },
  { name: "Skull crusher", category: "Arms" },

  { name: "Leg extension", category: "Legs" },
  { name: "Leg curl", category: "Legs" },
  { name: "Seated leg curl", category: "Legs" },
  { name: "Standing calf raise", category: "Legs" },
  { name: "Seated calf raise", category: "Legs" },

  { name: "Plank", category: "Core" },
  { name: "Hanging leg raise", category: "Core" },
  { name: "Cable crunch", category: "Core" },
  { name: "Ab wheel", category: "Core" },
];

export const LIFT_NAMES: string[] = LIFTS.map((l) => l.name);

/**
 * Trim and collapse internal whitespace, then adopt the catalog's spelling if
 * this is a known lift. Free-text entries keep the member's own capitalisation —
 * forcing title case would mangle things like "RDL".
 */
export function normalizeLiftName(raw: string): string {
  const cleaned = raw.trim().replace(/\s+/g, " ");
  const match = LIFTS.find(
    (l) => l.name.toLowerCase() === cleaned.toLowerCase(),
  );
  return match ? match.name : cleaned;
}

/** Catalog first, then the member's own history, deduped, for the lift picker. */
export function liftSuggestions(ownLifts: string[]): string[] {
  const seen = new Set(LIFT_NAMES.map((n) => n.toLowerCase()));
  const extras = ownLifts.filter((l) => !seen.has(l.toLowerCase()));
  return [...LIFT_NAMES, ...extras];
}
