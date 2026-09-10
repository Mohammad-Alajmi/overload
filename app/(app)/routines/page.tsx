import Link from "next/link";
import type { Metadata } from "next";
import { ROUTINES, DEFAULT_ROUTINE } from "@/lib/routines";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Routines" };

export default async function RoutinesPage() {
  const user = await getUser();
  const activeSlug =
    (user?.user_metadata?.active_routine as string | undefined) ??
    DEFAULT_ROUTINE;

  return (
    <>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight">Routines</h1>
        <p className="mt-0.5 text-sm text-muted">
          Three programmes, from three days a week to six. Pick one as active and
          your dashboard will tell you which day is due.
        </p>
      </div>

      <ul className="space-y-3">
        {ROUTINES.map((routine) => (
          <li key={routine.slug}>
            <Link
              href={`/routines/${routine.slug}`}
              className="block rounded-xl border border-line bg-surface p-4 transition-colors hover:border-accent/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold tracking-tight">
                      {routine.name}
                    </h2>
                    {routine.slug === activeSlug ? (
                      <span
                        className="label"
                        style={{ color: "var(--color-accent)" }}
                      >
                        Active
                      </span>
                    ) : null}
                  </div>
                  <p className="label mt-1">{routine.suits}</p>
                </div>
                <p className="nums shrink-0 text-sm text-accent">
                  {routine.daysPerWeek}
                  <span className="text-faint">/wk</span>
                </p>
              </div>
              <p className="mt-2.5 text-sm leading-relaxed text-muted">
                {routine.summary}
              </p>
              <p className="mt-3 flex flex-wrap gap-x-2 gap-y-1 border-t border-line pt-3 text-xs text-faint">
                {routine.days.map((day) => (
                  <span key={day.name} className="whitespace-nowrap">
                    {day.name}
                  </span>
                ))}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
