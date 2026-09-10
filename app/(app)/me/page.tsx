import type { Metadata } from "next";
import { getUser, displayNameOf } from "@/lib/supabase/server";
import { getSets } from "@/lib/data";
import { ownLifts } from "@/lib/progression";
import { ROUTINES, DEFAULT_ROUTINE } from "@/lib/routines";
import { logOutAction, setActiveRoutineAction } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/ui/stat-tile";
import { formatTonnage } from "@/lib/format";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Me" };

export default async function MePage() {
  const user = await getUser();
  const sets = await getSets();

  const name = user ? displayNameOf(user) : "there";
  const activeSlug =
    (user?.user_metadata?.active_routine as string | undefined) ??
    DEFAULT_ROUTINE;

  const tonnage = sets.reduce((sum, s) => sum + s.weight_kg * s.reps, 0);
  const sessions = new Set(sets.map((s) => s.performed_on)).size;

  return (
    <>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
        <p className="nums mt-0.5 text-sm text-muted">{user?.email}</p>
      </div>

      <section className="mb-6">
        <h2 className="label mb-2">All time</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Sets" value={String(sets.length)} accent />
          <StatTile label="Sessions" value={String(sessions)} />
          <StatTile label="Lifts" value={String(ownLifts(sets).length)} />
          <StatTile label="Tonnage" value={formatTonnage(tonnage)} />
        </div>
      </section>

      <section className="mb-6">
        <h2 className="label mb-2">Active routine</h2>
        <p className="mb-3 text-sm text-muted">
          Your dashboard uses this to work out which day is due next.
        </p>
        <ul className="space-y-2">
          {ROUTINES.map((routine) => {
            const active = routine.slug === activeSlug;
            return (
              <li key={routine.slug}>
                <form action={setActiveRoutineAction}>
                  <input type="hidden" name="routine" value={routine.slug} />
                  <button
                    type="submit"
                    disabled={active}
                    className={cn(
                      "flex w-full min-h-14 items-center justify-between gap-3 rounded-xl border px-4 text-left transition-colors",
                      active
                        ? "border-accent/40 bg-accent-dim/30"
                        : "border-line bg-surface hover:border-accent/30",
                    )}
                  >
                    <span>
                      <span className="block text-sm font-medium">
                        {routine.name}
                      </span>
                      <span className="label mt-0.5 block">
                        {routine.daysPerWeek} days a week
                      </span>
                    </span>
                    <span
                      className="label shrink-0"
                      style={
                        active ? { color: "var(--color-accent)" } : undefined
                      }
                    >
                      {active ? "Active" : "Choose"}
                    </span>
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mb-6 rounded-xl border border-line bg-surface p-4">
        <h2 className="label">Who can see this</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Only you. Every row is locked to its owner by a database policy, not by
          the page you happen to be looking at — so no other member can read your
          sets, and neither can anyone querying the database without a session.
        </p>
      </section>

      <form action={logOutAction}>
        <Button type="submit" variant="secondary" className="w-full">
          Log out
        </Button>
      </form>
    </>
  );
}
