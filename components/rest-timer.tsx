"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Rest timer for one exercise.
 *
 * Defaults to a minute and a half. Tap the clock to arm it, then drag sideways
 * to change the length — 5 seconds per small movement. Plus and minus buttons
 * sit alongside because a drag-only control is unusable by keyboard, and this
 * is the kind of thing you adjust with cold hands mid-session.
 *
 * The chosen length is remembered per exercise in this browser. It is a
 * per-device convenience, not data worth a database round trip.
 */

const STEP = 5;
const MIN = 15;
const MAX = 600;
/** Pixels of drag per 5-second step. */
const PX_PER_STEP = 9;

function mmss(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function clamp(n: number): number {
  return Math.min(MAX, Math.max(MIN, Math.round(n / STEP) * STEP));
}

export function RestTimer({
  liftKey,
  defaultSeconds,
  startToken,
}: {
  /** Storage key, so each exercise remembers its own rest. */
  liftKey: string;
  defaultSeconds: number;
  /** Increment to start the countdown — the parent does this when a set is logged. */
  startToken: number;
}) {
  const storageKey = `overload:rest:${liftKey}`;

  const [duration, setDuration] = useState(clamp(defaultSeconds));
  const [remaining, setRemaining] = useState(clamp(defaultSeconds));
  const [running, setRunning] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [done, setDone] = useState(false);

  // Restore this exercise's remembered length. Wrapped because storage throws
  // outright in some contexts (private windows, blocked site data).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const n = clamp(Number(saved));
        if (Number.isFinite(n)) {
          setDuration(n);
          setRemaining(n);
        }
      }
    } catch {
      // Keep the default.
    }
  }, [storageKey]);

  const persist = useCallback(
    (seconds: number) => {
      try {
        localStorage.setItem(storageKey, String(seconds));
      } catch {
        // Not important enough to surface.
      }
    },
    [storageKey],
  );

  // Countdown.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          setDone(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  // Start when the parent logs a set. Skipped on first render.
  const firstToken = useRef(startToken);
  useEffect(() => {
    if (startToken === firstToken.current) return;
    setRemaining(duration);
    setDone(false);
    setRunning(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startToken]);

  // Drag to adjust.
  const dragFrom = useRef<{ x: number; seconds: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!adjusting) return;
    dragFrom.current = { x: e.clientX, seconds: duration };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const from = dragFrom.current;
    if (!from) return;
    const steps = Math.round((e.clientX - from.x) / PX_PER_STEP);
    const next = clamp(from.seconds + steps * STEP);
    if (next !== duration) {
      setDuration(next);
      if (!running) setRemaining(next);
    }
  };

  const onPointerUp = () => {
    if (dragFrom.current) {
      dragFrom.current = null;
      persist(duration);
    }
  };

  const nudge = (by: number) => {
    const next = clamp(duration + by);
    setDuration(next);
    if (!running) setRemaining(next);
    persist(next);
  };

  const shown = running || remaining !== duration ? remaining : duration;
  const progress = duration > 0 ? 1 - remaining / duration : 0;

  return (
    <div className="flex items-center gap-2">
      {adjusting ? (
        <button
          type="button"
          onClick={() => nudge(-STEP)}
          aria-label="Shorten rest by 5 seconds"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line text-muted hover:text-ink"
        >
          −
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => {
          if (!adjusting) setAdjusting(true);
          else {
            setAdjusting(false);
            persist(duration);
          }
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        title={
          adjusting
            ? "Drag sideways to change the rest, tap to finish"
            : "Tap to change the rest length"
        }
        aria-label={
          adjusting
            ? `Rest ${mmss(duration)}. Drag sideways or use the plus and minus buttons to change it.`
            : `Rest timer, ${mmss(shown)}. Tap to change the length.`
        }
        className={cn(
          "relative flex min-h-9 items-center gap-2 overflow-hidden rounded-lg border px-3 select-none",
          adjusting
            ? "cursor-ew-resize border-accent bg-accent-dim/40 touch-none"
            : done
              ? "border-accent bg-accent-dim/30"
              : "border-line bg-ground",
        )}
      >
        {/* Progress fill, behind the numbers. */}
        {running ? (
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 bg-accent/15 transition-[width] duration-1000 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        ) : null}
        <span
          className={cn(
            "nums relative text-sm font-medium",
            done ? "text-accent" : running ? "text-ink" : "text-muted",
          )}
        >
          {done ? "Rest done" : mmss(shown)}
        </span>
        {adjusting ? (
          <span className="label relative" style={{ fontSize: "0.6rem" }}>
            drag
          </span>
        ) : null}
      </button>

      {adjusting ? (
        <button
          type="button"
          onClick={() => nudge(STEP)}
          aria-label="Lengthen rest by 5 seconds"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line text-muted hover:text-ink"
        >
          +
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            if (running) {
              setRunning(false);
            } else {
              setRemaining(duration);
              setDone(false);
              setRunning(true);
            }
          }}
          className="min-h-9 shrink-0 rounded-lg border border-line px-3 text-xs font-medium text-muted hover:text-ink"
        >
          {running ? "Pause" : done ? "Again" : "Start"}
        </button>
      )}
    </div>
  );
}
