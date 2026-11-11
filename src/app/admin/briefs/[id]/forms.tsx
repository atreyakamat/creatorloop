"use client";

import { useActionState } from "react";
import { Button, Field, Select } from "@/components/ui";
import { FormAlert } from "@/components/form-alert";
import { assignCreator, closeBrief, type AdminState } from "../../actions";

export function AssignForm({
  briefId,
  candidates,
  suggestedId,
}: {
  briefId: string;
  candidates: Array<{ id: string; label: string; rate: number | null }>;
  suggestedId?: string;
}) {
  const [state, action, pending] = useActionState<AdminState, FormData>(assignCreator.bind(null, briefId), undefined);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Creator"
          name="creator_id"
          placeholder="Choose a creator"
          defaultValue={suggestedId ?? ""}
          options={candidates.map((c) => ({ value: c.id, label: c.label }))}
          required
        />
        <Field
          label="Creator pay for this brief, ₹"
          name="budget_inr"
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="e.g. 4000"
          hint="Shown to the creator once assigned."
        />
      </div>
      <FormAlert error={state?.error} message={state?.ok} />
      <Button type="submit" variant="accent" disabled={pending}>
        {pending ? "Assigning…" : "Assign creator"}
      </Button>
    </form>
  );
}

export function CloseForm({ briefId, defaultAmount }: { briefId: string; defaultAmount: number | null }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(closeBrief.bind(null, briefId), undefined);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Payout amount, ₹"
          name="amount_inr"
          type="number"
          inputMode="numeric"
          min={0}
          defaultValue={defaultAmount ?? ""}
          required
        />
        <Field label="Note (optional)" name="note" maxLength={300} placeholder="UPI ref, adjustments…" />
      </div>
      <FormAlert error={state?.error} message={state?.ok} />
      <Button type="submit" variant="accent" disabled={pending}>
        {pending ? "Closing…" : "Complete brief and create payout"}
      </Button>
    </form>
  );
}
