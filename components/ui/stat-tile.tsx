import { cn } from "@/lib/cn";

export function StatTile({
  label,
  value,
  unit,
  accent = false,
  className,
}: {
  label: string;
  value: string;
  unit?: string;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-surface px-4 py-3",
        className,
      )}
    >
      <p className="label">{label}</p>
      <p className="mt-1 flex items-baseline gap-1">
        <span
          className={cn(
            "nums text-2xl font-semibold",
            accent ? "text-accent" : "text-ink",
          )}
        >
          {value}
        </span>
        {unit ? <span className="text-xs text-faint">{unit}</span> : null}
      </p>
    </div>
  );
}
