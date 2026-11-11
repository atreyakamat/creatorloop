"use client";

import { useActionState, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button, Field, TextArea, cn } from "@/components/ui";
import { FormAlert } from "@/components/form-alert";
import { GOALS, VIBES } from "@/lib/briefs";
import { createBrief, type FormState } from "../../actions";

function Question({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-2xl border border-ink-950/8 bg-white p-5">
      <legend className="sr-only">{title}</legend>
      <p className="mb-3 flex items-center gap-2 font-medium">
        <span className="grid size-6 place-items-center rounded-full bg-sunset-500/10 text-xs font-semibold text-sunset-600">
          {n}
        </span>
        {title}
      </p>
      {children}
    </fieldset>
  );
}

const chip =
  "cursor-pointer rounded-full border px-3.5 py-2 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sunset-500";

export function BriefForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createBrief, undefined);
  const [vibes, setVibes] = useState<string[]>([]);

  const toggleVibe = (v: string) =>
    setVibes((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : cur.length < 3 ? [...cur, v] : cur));

  return (
    <form action={action} className="space-y-4">
      <Question n={1} title="What do you want more of?">
        <div className="flex flex-wrap gap-2">
          {GOALS.map((g, i) => (
            <label
              key={g.value}
              className={cn(chip, "border-ink-950/10 has-[:checked]:border-ink-950 has-[:checked]:bg-ink-950 has-[:checked]:text-sand-50")}
            >
              <input type="radio" name="goal" value={g.value} className="sr-only" required={i === 0} />
              {g.label}
            </label>
          ))}
        </div>
      </Question>

      <Question n={2} title="What should the reel show off?">
        <TextArea
          label="Your star dish, room, product or experience"
          name="feature"
          placeholder="Our prawn rava fry and the sunset view from the deck"
          required
          minLength={3}
          maxLength={300}
          rows={2}
        />
      </Question>

      <Question n={3} title="What makes you different?">
        <TextArea
          label="Why should someone pick you over the place next door?"
          name="difference"
          placeholder="Family recipes, everything made in-house, and the only quiet spot on the beach road."
          required
          minLength={3}
          maxLength={400}
        />
      </Question>

      <Question n={4} title="Any offer or call to action?">
        <Field
          label="Optional"
          name="offer"
          placeholder="Free dessert with a table booking this month"
          maxLength={200}
        />
      </Question>

      <Question n={5} title="What's the vibe?">
        <p className="mb-3 text-sm text-ink-500">Pick up to three.</p>
        <div className="flex flex-wrap gap-2">
          {VIBES.map((v) => {
            const on = vibes.includes(v);
            return (
              <label
                key={v}
                className={cn(
                  chip,
                  on ? "border-sunset-500 bg-sunset-500 text-white" : "border-ink-950/10",
                  !on && vibes.length >= 3 && "opacity-40",
                )}
              >
                <input
                  type="checkbox"
                  name="vibes"
                  value={v}
                  checked={on}
                  onChange={() => toggleVibe(v)}
                  className="sr-only"
                />
                {v}
              </label>
            );
          })}
        </div>
      </Question>

      <div className="grid gap-4 rounded-2xl border border-ink-950/8 bg-white p-5 sm:grid-cols-2">
        <Field label="How many reels?" name="deliverables" type="number" min={1} max={8} defaultValue={4} required />
        <Field label="Needed by (optional)" name="due_date" type="date" />
      </div>

      <FormAlert error={state?.error} />
      <Button type="submit" variant="accent" disabled={pending} className="w-full">
        <Sparkles className="size-4" aria-hidden />
        {pending ? "Writing your brief… (about 15 seconds)" : "Write my brief"}
      </Button>
    </form>
  );
}
