import { Brand } from "@/components/brand";
import { ButtonLink } from "@/components/ui/button";

/**
 * What a stranger sees. Ticket 6 keeps them out of the app; this page gives them
 * somewhere legitimate to land and explains what Overload is, which is the
 * difference between a product and an assignment.
 *
 * The preview panel is built from CSS rather than a screenshot on purpose: a
 * screenshot would need the app to exist before the landing page could be
 * written, and it would go stale the first time the design changed.
 */
export default function LandingPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 pb-20">
      <header className="flex items-center justify-between py-6">
        <Brand />
        <nav className="flex items-center gap-2">
          <ButtonLink href="/login" variant="ghost" size="sm">
            Log in
          </ButtonLink>
          <ButtonLink href="/signup" size="sm">
            Sign up
          </ButtonLink>
        </nav>
      </header>

      <section className="grid items-center gap-12 pt-10 pb-16 lg:grid-cols-2 lg:pt-20">
        <div>
          <p className="label">Progressive overload, measured</p>
          <h1 className="mt-3 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
            Log every set.
            <br />
            <span className="text-accent">Watch the numbers move.</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
            Overload records the lift, the weight, the reps and the day, then
            works out your estimated one-rep max so you can see whether you are
            actually getting stronger — not just whether you turned up.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/signup">Start logging</ButtonLink>
            <ButtonLink href="/login" variant="secondary">
              I have an account
            </ButtonLink>
          </div>
          <p className="mt-6 text-xs text-faint">
            Your log is private. Nobody else can read your sets — not other
            members, not anyone poking at the database.
          </p>
        </div>

        {/* A live sample of the real interface, in the real components' language. */}
        <div
          aria-hidden
          className="rounded-2xl border border-line bg-surface p-4 shadow-2xl"
        >
          <div className="flex items-baseline justify-between border-b border-line pb-3">
            <div>
              <p className="text-sm font-medium">Today</p>
              <p className="label mt-0.5">Upper A</p>
            </div>
            <p className="nums text-xs text-faint">4 sets</p>
          </div>
          <ul className="divide-y divide-line">
            {[
              { lift: "Bench press", set: "92.5 kg × 5", rpe: "8", pr: true },
              { lift: "Bench press", set: "92.5 kg × 5", rpe: "8.5", pr: false },
              { lift: "Barbell row", set: "80 kg × 8", rpe: "7", pr: false },
              { lift: "Lat pulldown", set: "65 kg × 12", rpe: "8", pr: false },
            ].map((row, i) => (
              <li key={i} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{row.lift}</p>
                </div>
                <p className="nums text-sm">{row.set}</p>
                <p className="nums w-8 text-right text-xs text-faint">
                  {row.rpe}
                </p>
                {row.pr ? (
                  <span className="label text-accent" style={{ color: "var(--color-accent)" }}>
                    PR
                  </span>
                ) : (
                  <span className="w-6" />
                )}
              </li>
            ))}
          </ul>
          <div className="mt-3 rounded-lg border border-accent/30 bg-accent-dim/40 px-3 py-2 text-xs">
            <span className="text-accent">✓</span>{" "}
            <span className="text-muted">
              Bench press, 92.5 kg × 5 logged. New best.
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 border-t border-line pt-12 sm:grid-cols-3">
        {[
          {
            title: "One number that means something",
            body: "Estimated 1RM from weight and reps, so a heavy triple and a long set of ten can be compared honestly.",
          },
          {
            title: "Three routines, ready to log",
            body: "Full body, upper/lower, or push/pull/legs. Tap the day you are doing and the lifts are already filled in.",
          },
          {
            title: "Private by default",
            body: "Every row is locked to its owner at the database level, not hidden by the page you happen to be looking at.",
          },
        ].map((card) => (
          <div key={card.title}>
            <h2 className="text-sm font-semibold">{card.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              {card.body}
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}
