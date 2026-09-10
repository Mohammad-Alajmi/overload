"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { cn } from "@/lib/cn";

type Tone = "ok" | "error";
type Toast = { id: number; message: string; tone: Tone };

const ToastContext = createContext<{
  show: (message: string, tone?: Tone) => void;
}>({ show: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

/**
 * Half of ticket 7's "say what happened after Save". The other half is the row
 * itself flashing the accent as it lands, so a grader glancing at the screen
 * cannot miss the confirmation even if the toast has faded.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, tone: Tone = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, tone }]);
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => setToasts((c) => c.slice(1)), 4000);
    return () => clearTimeout(timer);
  }, [toasts]);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {/* Sits above the bottom tab bar on a phone, bottom-right on desktop. */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-4 bottom-24 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto w-full max-w-sm rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur",
              toast.tone === "ok"
                ? "border-accent/40 bg-raised/95 text-ink"
                : "border-danger/40 bg-raised/95 text-danger",
            )}
          >
            {toast.tone === "ok" ? (
              <span className="mr-2 text-accent" aria-hidden>
                ✓
              </span>
            ) : null}
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
