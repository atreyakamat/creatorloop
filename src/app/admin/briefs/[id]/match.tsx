"use client";

import { useActionState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui";
import { FormAlert } from "@/components/form-alert";
import { suggestMatches, type MatchState } from "../../actions";

export function MatchSuggestions({ briefId }: { briefId: string }) {
  const [state, action, pending] = useActionState<MatchState, FormData>(suggestMatches.bind(null, briefId), undefined);
  return (
    <div className="mb-5 rounded-xl border border-ink-950/8 p-4">
      <form action={action} className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-700">Not sure who fits? Get an AI shortlist. You still make the call.</p>
        <Button type="submit" variant="outline" disabled={pending} className="px-4 py-2">
          <Sparkles className="size-4" aria-hidden /> {pending ? "Thinking…" : "Suggest creators"}
        </Button>
      </form>
      {state?.error ? (
        <div className="mt-3">
          <FormAlert error={state.error} />
        </div>
      ) : null}
      {state?.picks ? (
        <ol className="mt-3 space-y-2">
          {state.picks.map((p, i) => (
            <li key={p.id} className="rounded-lg bg-sand-50 p-3 text-sm">
              <span className="font-medium">
                {i + 1}. {p.name}
              </span>
              <span className="text-ink-700">: {p.reason}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
