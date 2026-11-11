"use client";

import { useActionState } from "react";
import { Button, ButtonLink, TextArea } from "@/components/ui";
import { FormAlert } from "@/components/form-alert";
import { applyToBrief, type FormState } from "../../actions";

export function ApplyForm({ briefId, profileReady }: { briefId: string; profileReady: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(applyToBrief.bind(null, briefId), undefined);

  if (!profileReady) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="font-medium">Finish your profile to apply for this brief.</p>
        <ButtonLink href="/creator/profile?finish=1" variant="accent" className="px-4 py-2">
          Complete profile
        </ButtonLink>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <TextArea
        label="Why are you a good fit? (optional)"
        name="note"
        placeholder="I've shot three cafés in Assagao and can come by on a weekday morning."
        maxLength={500}
        rows={2}
      />
      <FormAlert error={state?.error} />
      <Button type="submit" variant="accent" disabled={pending}>
        {pending ? "Applying…" : "Apply for this brief"}
      </Button>
    </form>
  );
}
