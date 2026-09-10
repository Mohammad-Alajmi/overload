"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, NumberInput } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { updateProfileAction } from "@/app/auth/actions";

type State = { ok: boolean; message: string } | null;

export function ProfileForm({
  displayName,
  restSeconds,
}: {
  displayName: string;
  restSeconds: number;
}) {
  const { show } = useToast();
  const [state, action, pending] = useActionState<State, FormData>(
    updateProfileAction,
    null,
  );

  const handled = useRef<State>(null);
  useEffect(() => {
    if (!state || handled.current === state) return;
    handled.current = state;
    show(state.message, state.ok ? "ok" : "error");
  }, [state, show]);

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
      <Field label="Name" hint="What the app calls you.">
        <Input name="display_name" defaultValue={displayName} required maxLength={40} />
      </Field>
      <Field label="Rest" hint="Seconds, per set." className="sm:w-28">
        <NumberInput
          name="rest_seconds"
          defaultValue={restSeconds}
          min="15"
          max="600"
          step="5"
          required
        />
      </Field>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
