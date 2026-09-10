import Link from "next/link";
import type { Metadata } from "next";
import { getSets } from "@/lib/data";
import { bySession, ownLifts } from "@/lib/progression";
import { liftSuggestions } from "@/lib/lifts";
import { addSetHref } from "@/lib/links";
import { formatSet, todayISO } from "@/lib/format";
import { SetCard } from "@/components/set-card";
import { SetSheet } from "@/components/set-sheet";
import { SampleWeekButton } from "@/components/sample-week-button";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/field";

export const metadata: Metadata = { title: "Log" };

type Params = {
  add?: string;
  edit?: string;
  saved?: string;
  lift?: string;
  routine?: string;
  day?: string;
  q?: string;
  from?: string;
  to?: string;
};

export default async function LogPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const allSets = await getSets();

  // Filters run through search params, so a filtered view is a shareable URL.
  const query = (params.q ?? "").trim().toLowerCase();
  const filtered = allSets.filter((set) => {
    if (query && !set.lift.toLowerCase().includes(query)) return false;
    if (params.from && set.performed_on < params.from) return false;
    if (params.to && set.performed_on > params.to) return false;
    return true;
  });

  const sessions = bySession(filtered);
  const isFiltering = Boolean(query || params.from || params.to);

  const editing = params.edit
    ? (allSets.find((s) => s.id === params.edit) ?? null)
    : null;
  const sheetOpen = params.add === "1" || editing !== null;

  // What this lift did last time, so the sheet can show a number to beat.
  const prefillLift = editing?.lift ?? params.lift ?? null;
  const previous = prefillLift
    ? allSets.find(
        (s) => s.lift === prefillLift && (!editing || s.id !== editing.id),
      )
    : undefined;

  return (
    <>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Log</h1>
          <p className="mt-0.5 text-sm text-muted">
            {allSets.length === 0
              ? "Nothing logged yet."
              : `${allSets.length} ${allSets.length === 1 ? "set" : "sets"} recorded.`}
          </p>
        </div>
        <ButtonLink href={addSetHref()} className="hidden sm:inline-flex">
          Add a set
        </ButtonLink>
      </div>

      {allSets.length > 0 ? (
        <form
          method="GET"
          action="/log"
          className="mb-5 grid gap-2 rounded-xl border border-line bg-surface p-3 sm:grid-cols-[1fr_auto_auto_auto]"
        >
          <Input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Search a lift"
            aria-label="Search a lift"
          />
          <Input
            name="from"
            type="date"
            defaultValue={params.from ?? ""}
            aria-label="From date"
            className="nums sm:w-40"
          />
          <Input
            name="to"
            type="date"
            defaultValue={params.to ?? ""}
            aria-label="To date"
            className="nums sm:w-40"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="min-h-11 flex-1 rounded-lg border border-line bg-raised px-4 text-sm font-medium hover:bg-line"
            >
              Filter
            </button>
            {isFiltering ? (
              <Link
                href="/log"
                className="flex min-h-11 items-center rounded-lg px-3 text-sm text-muted hover:text-ink"
              >
                Clear
              </Link>
            ) : null}
          </div>
        </form>
      ) : null}

      {sessions.length === 0 ? (
        isFiltering ? (
          <EmptyState
            title="No sets match that."
            body="Try a different lift name, or widen the dates."
            action={
              <ButtonLink href="/log" variant="secondary">
                Clear the filter
              </ButtonLink>
            }
          />
        ) : (
          <EmptyState
            title="No sets yet. Log your first lift."
            body="Every set you record here builds the numbers on your progress page. Start with whatever you did today."
            action={
              <>
                <ButtonLink href={addSetHref()}>Add your first set</ButtonLink>
                <SampleWeekButton />
              </>
            }
          />
        )
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <SetCard
              key={session.day}
              day={session.day}
              sets={session.sets}
              allSets={allSets}
              savedId={params.saved}
            />
          ))}
        </div>
      )}

      {/* Floating add button — thumb-reachable, phones only. */}
      <Link
        href={addSetHref()}
        aria-label="Add a set"
        className="fixed bottom-20 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl font-light text-accent-ink shadow-xl sm:hidden"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <span aria-hidden>+</span>
      </Link>

      {sheetOpen ? (
        <SetSheet
          suggestions={liftSuggestions(ownLifts(allSets))}
          editing={editing}
          today={todayISO()}
          prefill={{
            lift: params.lift,
            routine: params.routine,
            day: params.day,
          }}
          lastTime={previous ? formatSet(previous) : null}
        />
      ) : null}
    </>
  );
}
