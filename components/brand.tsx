import { cn } from "@/lib/cn";

/** The wordmark. The accent bar is the only decoration the brand gets. */
export function Brand({
  className,
  size = "md",
}: {
  className?: string;
  size?: "md" | "lg";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-semibold tracking-tight",
        size === "lg" ? "text-2xl" : "text-base",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "block rounded-full bg-accent",
          size === "lg" ? "h-6 w-1.5" : "h-4 w-1",
        )}
      />
      Overload
    </span>
  );
}
