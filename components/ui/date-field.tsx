"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * An English date picker.
 *
 * `<input type="date">` renders its text and its calendar in the *browser's* UI
 * language, not the page's. On an Arabic-locale browser the log filters read as
 * "كنس/رهش/موي" and there is no markup that overrides it — not `lang`, not
 * `dir`. So the control is built by hand with the month and weekday names
 * written out, which makes it read the same for everybody.
 *
 * The value still travels as a plain `yyyy-mm-dd` hidden input, so the server
 * action and the database column are unchanged.
 */

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function toISO(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function fromISO(iso: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  return { y: +match[1], m: +match[2] - 1, d: +match[3] };
}

function todayParts() {
  const now = new Date();
  return { y: now.getFullYear(), m: now.getMonth(), d: now.getDate() };
}

/** Monday-first offset for the 1st of a month. */
function leadingBlanks(year: number, month: number): number {
  const jsDay = new Date(year, month, 1).getDay(); // 0 = Sunday
  return (jsDay + 6) % 7;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function labelFor(iso: string): string {
  const parts = fromISO(iso);
  if (!parts) return "Pick a date";
  const t = todayParts();
  if (parts.y === t.y && parts.m === t.m && parts.d === t.d) return "Today";

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (
    parts.y === yesterday.getFullYear() &&
    parts.m === yesterday.getMonth() &&
    parts.d === yesterday.getDate()
  ) {
    return "Yesterday";
  }

  return `${parts.d} ${MONTHS_SHORT[parts.m]} ${parts.y}`;
}

export function DateField({
  name,
  defaultValue,
  className,
  allowEmpty = false,
  placeholder = "Any date",
}: {
  name: string;
  defaultValue?: string;
  className?: string;
  /** Filters need a cleared state; a set's date does not. */
  allowEmpty?: boolean;
  placeholder?: string;
}) {
  const initial = defaultValue && fromISO(defaultValue) ? defaultValue : "";
  const [value, setValue] = useState(initial);
  const [open, setOpen] = useState(false);

  const start = fromISO(value) ?? todayParts();
  const [viewYear, setViewYear] = useState(start.y);
  const [viewMonth, setViewMonth] = useState(start.m);

  const root = useRef<HTMLDivElement>(null);

  // Close on an outside click or Escape, the way a popover should.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (day: number) => {
    setValue(toISO(viewYear, viewMonth, day));
    setOpen(false);
  };

  const step = (by: number) => {
    const next = new Date(viewYear, viewMonth + by, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const selected = fromISO(value);
  const t = todayParts();
  const blanks = leadingBlanks(viewYear, viewMonth);
  const total = daysInMonth(viewYear, viewMonth);

  return (
    <div ref={root} className={cn("relative", className)}>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "flex w-full min-h-11 items-center justify-between gap-2 rounded-lg border border-line bg-ground px-3 text-left",
          value ? "text-ink" : "text-faint",
        )}
      >
        <span className="nums text-sm">
          {value ? labelFor(value) : placeholder}
        </span>
        <span aria-hidden className="text-faint">
          ▾
        </span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Choose a date"
          className="absolute left-0 z-50 mt-1 w-72 rounded-xl border border-line bg-raised p-3 shadow-2xl"
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous month"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-line hover:text-ink"
            >
              ‹
            </button>
            <p className="nums text-sm font-medium">
              {MONTHS[viewMonth]} {viewYear}
            </p>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next month"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-line hover:text-ink"
            >
              ›
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-0.5">
            {WEEKDAYS.map((d) => (
              <span
                key={d}
                className="label text-center"
                style={{ fontSize: "0.6rem" }}
              >
                {d.slice(0, 2)}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: blanks }).map((_, i) => (
              <span key={`b${i}`} />
            ))}
            {Array.from({ length: total }, (_, i) => i + 1).map((day) => {
              const isSelected =
                selected &&
                selected.y === viewYear &&
                selected.m === viewMonth &&
                selected.d === day;
              const isToday =
                t.y === viewYear && t.m === viewMonth && t.d === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => choose(day)}
                  className={cn(
                    "nums flex h-9 items-center justify-center rounded-lg text-sm transition-colors",
                    isSelected
                      ? "bg-accent font-semibold text-accent-ink"
                      : isToday
                        ? "text-accent hover:bg-line"
                        : "text-ink hover:bg-line",
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex gap-2 border-t border-line pt-2">
            <button
              type="button"
              onClick={() => {
                const now = todayParts();
                setViewYear(now.y);
                setViewMonth(now.m);
                setValue(toISO(now.y, now.m, now.d));
                setOpen(false);
              }}
              className="min-h-9 flex-1 rounded-lg bg-line px-2 text-xs font-medium hover:bg-surface"
            >
              Today
            </button>
            {allowEmpty ? (
              <button
                type="button"
                onClick={() => {
                  setValue("");
                  setOpen(false);
                }}
                className="min-h-9 rounded-lg px-3 text-xs text-muted hover:text-ink"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
