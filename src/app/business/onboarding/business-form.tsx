"use client";

import { useActionState } from "react";
import { Button, Field, Select, TextArea } from "@/components/ui";
import { FormAlert } from "@/components/form-alert";
import { CATEGORIES } from "@/lib/briefs";
import type { Business } from "@/lib/supabase/types";
import { saveBusiness, type FormState } from "../actions";

const PRICE_RANGES = [
  { value: "budget", label: "Budget-friendly" },
  { value: "mid", label: "Mid-range" },
  { value: "premium", label: "Premium" },
];

export function BusinessForm({ business }: { business: Business | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveBusiness, undefined);

  return (
    <form action={action} className="space-y-5">
      <Field label="Business name" name="name" defaultValue={business?.name} required maxLength={80} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Select
          label="Type of business"
          name="category"
          defaultValue={business?.category ?? ""}
          placeholder="Choose one"
          options={CATEGORIES.map((c) => ({ value: c, label: c }))}
          required
        />
        <Field
          label="Area"
          name="area"
          defaultValue={business?.area ?? ""}
          placeholder="Assagao, Panjim, Mapusa…"
          maxLength={60}
        />
      </div>
      <Field
        label="Instagram handle"
        name="instagram"
        defaultValue={business?.instagram ?? ""}
        placeholder="@yourplace"
        maxLength={60}
      />
      <TextArea
        label="What do you offer?"
        name="about"
        defaultValue={business?.about ?? ""}
        placeholder="All-day breakfast café with Goan-Portuguese bakes and a balcony overlooking the fields."
        maxLength={400}
      />
      <TextArea
        label="Who comes in today?"
        name="audience"
        defaultValue={business?.audience ?? ""}
        placeholder="Remote workers on weekdays, tourists and families on weekends."
        maxLength={300}
      />
      <Select
        label="Price range"
        name="price_range"
        defaultValue={business?.price_range ?? ""}
        placeholder="Choose one"
        options={PRICE_RANGES}
      />
      <FormAlert error={state?.error} />
      <Button type="submit" variant="accent" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Saving…" : business ? "Save changes" : "Save and continue"}
      </Button>
    </form>
  );
}
