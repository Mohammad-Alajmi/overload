import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "sm";

/* Every tap target clears 44px on its smallest axis — ticket 7 is graded on a
   phone, and a 32px button is the first thing that gives an app away. */
const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none select-none";

const sizes: Record<Size, string> = {
  md: "min-h-11 px-4 text-sm",
  sm: "min-h-11 px-3 text-sm sm:min-h-9",
};

const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink hover:bg-accent/90 font-semibold",
  secondary: "bg-raised text-ink hover:bg-line border border-line",
  ghost: "text-muted hover:text-ink hover:bg-raised",
  danger: "text-danger hover:bg-danger/10 border border-danger/30",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      className={cn(base, sizes[size], variants[variant], className)}
      {...props}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ComponentProps<typeof Link> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <Link
      className={cn(base, sizes[size], variants[variant], className)}
      {...props}
    />
  );
}
