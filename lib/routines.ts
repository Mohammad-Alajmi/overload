import type { RoutineSlug } from "./types";

/**
 * Routines live in code, not in the database. They are identical for every
 * member, so a table would mean another migration, another RLS policy to get
 * right, a seed step, and a query — for data that never changes.
 *
 * Every lift name here must match lib/lifts.ts exactly, or a logged set will
 * not join up with its routine on the progression chart.
 */

export type RoutineLift = {
  lift: string;
  sets: number;
  /** Rep target as written on a programme, e.g. "5" or "8-12". */
  reps: string;
};

export type RoutineDay = {
  /** Stored in sets.routine_day, so keep these stable. */
  name: string;
  focus: string;
  lifts: RoutineLift[];
};

export type Routine = {
  slug: RoutineSlug;
  name: string;
  daysPerWeek: number;
  suits: string;
  summary: string;
  days: RoutineDay[];
};

export const ROUTINES: Routine[] = [
  {
    slug: "full-body-3",
    name: "Full body",
    daysPerWeek: 3,
    suits: "Beginners, or anyone with three days a week",
    summary:
      "Every session trains the whole body, so missing one costs you less. The fastest way to learn the main lifts.",
    days: [
      {
        name: "Day A",
        focus: "Squat and press",
        lifts: [
          { lift: "Back squat", sets: 3, reps: "5" },
          { lift: "Bench press", sets: 3, reps: "5" },
          { lift: "Barbell row", sets: 3, reps: "8" },
          { lift: "Plank", sets: 3, reps: "30-60s" },
        ],
      },
      {
        name: "Day B",
        focus: "Hinge and overhead",
        lifts: [
          { lift: "Deadlift", sets: 2, reps: "5" },
          { lift: "Overhead press", sets: 3, reps: "6-8" },
          { lift: "Lat pulldown", sets: 3, reps: "8-12" },
          { lift: "Leg curl", sets: 3, reps: "10-12" },
        ],
      },
      {
        name: "Day C",
        focus: "Volume and arms",
        lifts: [
          { lift: "Front squat", sets: 3, reps: "6-8" },
          { lift: "Incline bench press", sets: 3, reps: "8-10" },
          { lift: "Seated cable row", sets: 3, reps: "10-12" },
          { lift: "Dumbbell curl", sets: 3, reps: "10-12" },
          { lift: "Triceps pushdown", sets: 3, reps: "10-12" },
        ],
      },
    ],
  },
  {
    slug: "upper-lower-4",
    name: "Upper / Lower",
    daysPerWeek: 4,
    suits: "Intermediates who can train four days",
    summary:
      "Each half of the body twice a week. The best balance of frequency and recovery, and the split most lifters stay on longest.",
    days: [
      {
        name: "Upper A",
        focus: "Heavy horizontal",
        lifts: [
          { lift: "Bench press", sets: 4, reps: "5-6" },
          { lift: "Barbell row", sets: 4, reps: "6-8" },
          { lift: "Seated dumbbell press", sets: 3, reps: "8-10" },
          { lift: "Lat pulldown", sets: 3, reps: "10-12" },
          { lift: "Triceps pushdown", sets: 3, reps: "10-12" },
          { lift: "Barbell curl", sets: 3, reps: "10-12" },
        ],
      },
      {
        name: "Lower A",
        focus: "Squat focus",
        lifts: [
          { lift: "Back squat", sets: 4, reps: "5-6" },
          { lift: "Romanian deadlift", sets: 3, reps: "8-10" },
          { lift: "Leg press", sets: 3, reps: "10-12" },
          { lift: "Leg curl", sets: 3, reps: "10-12" },
          { lift: "Standing calf raise", sets: 4, reps: "12-15" },
        ],
      },
      {
        name: "Upper B",
        focus: "Vertical and volume",
        lifts: [
          { lift: "Overhead press", sets: 4, reps: "5-6" },
          { lift: "Pull-up", sets: 4, reps: "6-10" },
          { lift: "Dumbbell incline press", sets: 3, reps: "8-12" },
          { lift: "Chest-supported row", sets: 3, reps: "10-12" },
          { lift: "Lateral raise", sets: 3, reps: "12-15" },
          { lift: "Hammer curl", sets: 3, reps: "10-12" },
        ],
      },
      {
        name: "Lower B",
        focus: "Hinge focus",
        lifts: [
          { lift: "Deadlift", sets: 3, reps: "4-5" },
          { lift: "Front squat", sets: 3, reps: "6-8" },
          { lift: "Bulgarian split squat", sets: 3, reps: "8-10" },
          { lift: "Leg extension", sets: 3, reps: "12-15" },
          { lift: "Seated calf raise", sets: 4, reps: "12-15" },
        ],
      },
    ],
  },
  {
    slug: "ppl-6",
    name: "Push / Pull / Legs",
    daysPerWeek: 6,
    suits: "Advanced lifters with six days and good recovery",
    summary:
      "Each pattern twice a week across six sessions. The most total volume of the three, and the least forgiving if you miss days.",
    days: [
      {
        name: "Push A",
        focus: "Chest emphasis",
        lifts: [
          { lift: "Bench press", sets: 4, reps: "5-6" },
          { lift: "Seated dumbbell press", sets: 3, reps: "8-10" },
          { lift: "Cable fly", sets: 3, reps: "12-15" },
          { lift: "Lateral raise", sets: 3, reps: "12-15" },
          { lift: "Triceps pushdown", sets: 3, reps: "10-12" },
        ],
      },
      {
        name: "Pull A",
        focus: "Width",
        lifts: [
          { lift: "Pull-up", sets: 4, reps: "6-10" },
          { lift: "Barbell row", sets: 4, reps: "6-8" },
          { lift: "Straight-arm pulldown", sets: 3, reps: "12-15" },
          { lift: "Face pull", sets: 3, reps: "15-20" },
          { lift: "Barbell curl", sets: 3, reps: "10-12" },
        ],
      },
      {
        name: "Legs A",
        focus: "Squat emphasis",
        lifts: [
          { lift: "Back squat", sets: 4, reps: "5-6" },
          { lift: "Romanian deadlift", sets: 3, reps: "8-10" },
          { lift: "Leg extension", sets: 3, reps: "12-15" },
          { lift: "Leg curl", sets: 3, reps: "12-15" },
          { lift: "Standing calf raise", sets: 4, reps: "12-15" },
        ],
      },
      {
        name: "Push B",
        focus: "Shoulder emphasis",
        lifts: [
          { lift: "Overhead press", sets: 4, reps: "5-6" },
          { lift: "Incline bench press", sets: 3, reps: "8-10" },
          { lift: "Machine chest press", sets: 3, reps: "10-12" },
          { lift: "Cable lateral raise", sets: 3, reps: "15-20" },
          { lift: "Overhead triceps extension", sets: 3, reps: "10-12" },
        ],
      },
      {
        name: "Pull B",
        focus: "Thickness",
        lifts: [
          { lift: "Deadlift", sets: 3, reps: "4-5" },
          { lift: "Chest-supported row", sets: 4, reps: "8-10" },
          { lift: "Lat pulldown", sets: 3, reps: "10-12" },
          { lift: "Shrug", sets: 3, reps: "12-15" },
          { lift: "Hammer curl", sets: 3, reps: "10-12" },
        ],
      },
      {
        name: "Legs B",
        focus: "Hinge and unilateral",
        lifts: [
          { lift: "Front squat", sets: 4, reps: "6-8" },
          { lift: "Hip thrust", sets: 3, reps: "8-10" },
          { lift: "Bulgarian split squat", sets: 3, reps: "8-10" },
          { lift: "Seated leg curl", sets: 3, reps: "12-15" },
          { lift: "Seated calf raise", sets: 4, reps: "12-15" },
        ],
      },
    ],
  },
];

export const DEFAULT_ROUTINE: RoutineSlug = "upper-lower-4";

export function getRoutine(slug: string | null | undefined): Routine | null {
  if (!slug) return null;
  return ROUTINES.find((r) => r.slug === slug) ?? null;
}

export function getRoutineDay(
  slug: string | null | undefined,
  dayName: string | null | undefined,
): RoutineDay | null {
  const routine = getRoutine(slug);
  if (!routine || !dayName) return null;
  return routine.days.find((d) => d.name === dayName) ?? null;
}

/**
 * Which day is due next. Derived rather than stored: find the most recent set
 * that carried this routine's tag and offer the day after it, wrapping around.
 * A member with no history yet gets day one.
 */
export function nextWorkout(
  routine: Routine,
  lastDayName: string | null,
): RoutineDay {
  if (!lastDayName) return routine.days[0];
  const index = routine.days.findIndex((d) => d.name === lastDayName);
  if (index === -1) return routine.days[0];
  return routine.days[(index + 1) % routine.days.length];
}
