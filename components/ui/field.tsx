import { cn } from "@/lib/cn";

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="label block mb-1.5">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-danger">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-faint">{hint}</span>
      ) : null}
    </label>
  );
}

const inputBase =
  "w-full min-h-11 rounded-lg border border-line bg-ground px-3 text-ink placeholder:text-faint focus:border-accent focus:outline-none";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputBase, className)} {...props} />;
}

/**
 * For weights, reps and RPE: mono tabular figures and a numeric keypad.
 *
 * Deliberately `type="text"` rather than `type="number"`. Chrome renders a
 * number input's value in the browser locale's numbering system, so on an
 * Arabic-locale browser a weight of 92.5 displays as ٩٢٫٥ — the same problem
 * the date input has, and just as impossible to override with markup. A text
 * input renders the literal string, so the digits stay as typed.
 *
 * `inputMode="decimal"` still brings up the numeric keypad on a phone, and the
 * values are validated on the server and by the database CHECK constraints,
 * which is where it has to hold anyway.
 */
export function NumberInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="text"
      inputMode="decimal"
      autoComplete="off"
      lang="en"
      dir="ltr"
      className={cn(inputBase, "nums", className)}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(inputBase, "min-h-20 py-2 resize-y", className)}
      {...props}
    />
  );
}
