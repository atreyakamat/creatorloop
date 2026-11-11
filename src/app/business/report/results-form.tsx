"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui";
import { FormAlert } from "@/components/form-alert";
import { saveReelResults, type FormState } from "../actions";

const input =
  "w-28 rounded-xl border border-ink-950/10 bg-white px-3 py-2 text-base tabular-nums focus:border-sunset-500 focus:outline-none focus:ring-2 focus:ring-sunset-500/20";

export function ResultsForm({ id, views, likes }: { id: string; views: number | null; likes: number | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveReelResults.bind(null, id), undefined);
  return (
    <form action={action} className="mt-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="block text-sm text-ink-700">
          Views
          <input name="views" type="number" inputMode="numeric" min={0} defaultValue={views ?? ""} className={`${input} mt-1 block`} />
        </label>
        <label className="block text-sm text-ink-700">
          Likes
          <input name="likes" type="number" inputMode="numeric" min={0} defaultValue={likes ?? ""} className={`${input} mt-1 block`} />
        </label>
        <Button type="submit" variant="outline" disabled={pending} className="px-4 py-2">
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
      <FormAlert error={state?.error} />
    </form>
  );
}
