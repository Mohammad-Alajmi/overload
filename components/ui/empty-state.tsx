import { cn } from "@/lib/cn";

/**
 * Ticket 7 singles out the empty state as the thing almost nobody does, and it
 * is the first thing a stranger sees. Every list, chart and stat in this app
 * gets one, with copy written for that specific situation — never "No data".
 */
export function EmptyState({
  title,
  body,
  action,
  className,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-line bg-surface/40 px-6 py-12 text-center",
        className,
      )}
    >
      <p className="text-base font-medium text-ink">{title}</p>
      {body ? (
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">{body}</p>
      ) : null}
      {action ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {action}
        </div>
      ) : null}
    </div>
  );
}
