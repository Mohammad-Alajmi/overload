"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { loadSampleWeekAction } from "@/app/(app)/log/actions";

/**
 * Only ever offered from an empty state, never run on signup. A new account
 * meets the real empty state first — filling it is a choice the member makes.
 */
export function SampleWeekButton() {
  const { show } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="secondary"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await loadSampleWeekAction();
          if (result.ok) {
            show(result.message);
            router.refresh();
          } else {
            show(result.error, "error");
          }
        })
      }
    >
      {pending ? "Adding…" : "Load a sample week"}
    </Button>
  );
}
