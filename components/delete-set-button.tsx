"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { deleteSetAction } from "@/app/(app)/log/actions";
import type { ActionResult } from "@/lib/types";

/**
 * Ticket 10 asks for delete; the confirm step is because a mis-tap on a phone
 * should not silently destroy a logged set. Two taps, no modal — the second tap
 * is the confirmation.
 */
export function DeleteSetButton({
  id,
  label,
}: {
  id: string;
  label: string;
}) {
  const { show } = useToast();
  const [armed, setArmed] = useState(false);
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(deleteSetAction, null);

  const handled = useRef<ActionResult | null>(null);

  useEffect(() => {
    if (!state || handled.current === state) return;
    handled.current = state;
    if (state.ok) show(`${label} deleted.`);
    else show(state.error, "error");
  }, [state, show, label]);

  // Disarm after a few seconds so a half-pressed delete does not stay live.
  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(timer);
  }, [armed]);

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        aria-label={`Delete ${label}`}
        className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-faint transition-colors hover:bg-raised hover:text-danger"
      >
        <span aria-hidden>×</span>
      </button>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-lg px-2 text-xs font-medium text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
      >
        {pending ? "…" : "Sure?"}
      </button>
    </form>
  );
}
