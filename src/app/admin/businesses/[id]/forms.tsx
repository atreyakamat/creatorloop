"use client";

import { useActionState, useState } from "react";
import { Button, Field, Select } from "@/components/ui";
import { FormAlert } from "@/components/form-alert";
import { plans } from "@/config/site";
import { createInvoice, setBusinessPlan, type AdminState } from "../../actions";

const planOptions = [
  { value: "none", label: "No plan" },
  ...plans.map((p) => ({ value: p.id, label: p.reels ? `${p.name} (${p.reels} reels)` : p.name })),
];

export function PlanForm({ businessId, plan, reels }: { businessId: string; plan: string; reels: number }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(setBusinessPlan.bind(null, businessId), undefined);
  const [selected, setSelected] = useState(plan);
  const [count, setCount] = useState(String(reels || ""));

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Plan"
          name="plan"
          value={selected}
          onChange={(e) => {
            const next = e.target.value;
            setSelected(next);
            const preset = plans.find((p) => p.id === next)?.reels;
            setCount(next === "none" ? "" : preset ? String(preset) : count);
          }}
          options={planOptions}
        />
        <Field
          label="Reels per month"
          name="reels_per_month"
          type="number"
          inputMode="numeric"
          min={0}
          max={200}
          value={count}
          onChange={(e) => setCount(e.target.value)}
          disabled={selected === "none"}
        />
      </div>
      <FormAlert error={state?.error} message={state?.ok} />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save plan"}
      </Button>
    </form>
  );
}

export function InvoiceForm({ businessId, month, defaultAmount }: { businessId: string; month: string; defaultAmount: number | null }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(createInvoice.bind(null, businessId), undefined);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Month" name="month" type="month" defaultValue={month} max={month} required />
        <Field label="Amount, ₹" name="amount_inr" type="number" inputMode="numeric" min={1} defaultValue={defaultAmount ?? ""} required />
        <Field label="Note (optional)" name="note" maxLength={300} />
      </div>
      <FormAlert error={state?.error} message={state?.ok} />
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Creating…" : "Create invoice"}
      </Button>
    </form>
  );
}
