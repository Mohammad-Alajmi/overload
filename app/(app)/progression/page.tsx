import Link from "next/link";
import type { Metadata } from "next";
import { getSets } from "@/lib/data";
import {
  liftTrend,
  ownLifts,
  prFor,
  sessionDelta,
  setE1rm,
} from "@/lib/progression";
import {
  formatDelta,
  formatE1rm,
  formatSet,
  formatDay,
  formatWeight,
} from "@/lib/format";
import { addSetHref, liftHref } from "@/lib/links";
import { E1rmChart } from "@/components/e1rm-chart";
import { EmptyState } from "@/components/ui/empty-state";
import { StatTile } from "@/components/ui/stat-tile";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Progress" };

export default async function ProgressionPage({
  searchParams,
}: {
  searchParams: Promise<{ lift?: string }>;
}) {
  const { lift: requested } = await searchParams;
  const sets = await getSets();
  const lifts = ownLifts(sets);

  if (lifts.length === 0) {
    return (
      <>
        <h1 className="mb-5 text-2xl font-semibold tracking-tight">Progress</h1>
        <EmptyState
          title="Nothing to plot yet."
          body="Log a few sets and this page will show your estimated one-rep max for each lift, and whether it is going up."
          action={<ButtonLink href={addSetHref()}>Add a set</ButtonLink>}
        />
      </>
    );
  }

  const lift = requested && lifts.includes(requested) ? requested : lifts[0];
  const trend = liftTrend(sets, lift);
  const pr = prFor(sets, lift);
  const delta = sessionDelta(sets, lift);
  const latest = trend[trend.length - 1];

  return (
    <>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight">Progress</h1>
        <p className="mt-0.5 text-sm text-muted">
          Estimated one-rep max, so a heavy triple and a long set of ten can be
          compared honestly.
        </p>
      </div>

      {/* Lift selector. Links rather than a select, so each lift has a URL. */}
      <nav className="mb-5 -mx-5 overflow-x-auto px-5">
        <ul className="flex gap-2 pb-1">
          {lifts.map((name) => (
            <li key={name}>
              <Link
                href={liftHref(name)}
                aria-current={name === lift ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center whitespace-nowrap rounded-lg border px-3 text-sm transition-colors",
                  name === lift
                    ? "border-accent/40 bg-accent-dim/50 font-medium text-accent"
                    : "border-line bg-surface text-muted hover:text-ink",
                )}
              >
                {name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {trend.length === 1 ? (
        <EmptyState
          className="mb-5"
          title="One session logged."
          body={`${lift} is on the board at ${formatE1rm(latest.e1rm)} estimated. Come back after the next one and the line will have somewhere to go.`}
          action={
            <ButtonLink href={addSetHref({ lift })}>
              Log {lift.toLowerCase()}
            </ButtonLink>
          }
        />
      ) : (
        <div className="mb-5">
          <E1rmChart points={trend} />
        </div>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile
          label="Best estimated"
          value={pr ? formatWeight(Math.round(setE1rm(pr) * 10) / 10) : "—"}
          unit="kg"
          accent
        />
        <StatTile
          label="Last session"
          value={delta === null ? "—" : formatDelta(delta)}
          unit={delta === null ? "first one" : "vs previous"}
        />
        <StatTile
          label="Sessions"
          value={String(trend.length)}
          unit={trend.length === 1 ? "logged" : "logged"}
          className="col-span-2 sm:col-span-1"
        />
      </div>

      <section className="rounded-xl border border-line bg-surface p-4">
        <h2 className="label">How this is worked out</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Estimated 1RM uses the Epley formula:{" "}
          <span className="nums text-ink">weight × (1 + reps ÷ 30)</span>. Your
          best {lift.toLowerCase()} set is{" "}
          {pr ? (
            <>
              <span className="nums text-ink">{formatSet(pr)}</span> on{" "}
              <span className="nums text-ink">{formatDay(pr.performed_on)}</span>
              , which estimates{" "}
              <span className="nums text-accent">
                {formatE1rm(setE1rm(pr))}
              </span>
              .
            </>
          ) : (
            "not recorded yet."
          )}{" "}
          It is an estimate, not a tested max — useful for spotting a trend, not
          for telling you what to attempt.
        </p>
      </section>
    </>
  );
}
