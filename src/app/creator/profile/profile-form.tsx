"use client";

import { useActionState, useState } from "react";
import { Button, Field, TextArea, cn } from "@/components/ui";
import { FormAlert } from "@/components/form-alert";
import { NICHES } from "@/lib/creators";
import type { CreatorProfile } from "@/lib/supabase/types";
import { saveCreatorProfile, type FormState } from "../actions";

export function ProfileForm({ profile }: { profile: CreatorProfile }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveCreatorProfile, undefined);
  const [niches, setNiches] = useState<string[]>(profile.niches);

  const toggle = (n: string) =>
    setNiches((cur) => (cur.includes(n) ? cur.filter((x) => x !== n) : cur.length < 5 ? [...cur, n] : cur));

  return (
    <form action={action} className="space-y-5">
      <Field label="Name shown to businesses" name="display_name" defaultValue={profile.display_name} required maxLength={60} />
      <Field
        label="Instagram handle"
        name="instagram"
        defaultValue={profile.instagram ?? ""}
        placeholder="@yourhandle"
        required
        maxLength={120}
      />
      <TextArea
        label="About your work"
        name="bio"
        defaultValue={profile.bio ?? ""}
        placeholder="I shoot food and café reels around North Goa. Natural light, quick cuts, no fuss."
        required
        minLength={20}
        maxLength={600}
        rows={4}
      />
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink-700">What do you shoot? (up to five)</legend>
        <div className="flex flex-wrap gap-2">
          {NICHES.map((n) => {
            const on = niches.includes(n);
            return (
              <label
                key={n}
                className={cn(
                  "cursor-pointer rounded-full border px-3.5 py-2 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sunset-500",
                  on ? "border-sunset-500 bg-sunset-500 text-white" : "border-ink-950/10 bg-white",
                  !on && niches.length >= 5 && "opacity-40",
                )}
              >
                <input type="checkbox" name="niches" value={n} checked={on} onChange={() => toggle(n)} className="sr-only" />
                {n}
              </label>
            );
          })}
        </div>
      </fieldset>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Followers (optional)"
          name="followers"
          type="number"
          inputMode="numeric"
          min={0}
          defaultValue={profile.followers ?? ""}
        />
        <Field
          label="Your rate per reel, ₹ (optional)"
          name="rate_per_reel"
          type="number"
          inputMode="numeric"
          min={0}
          defaultValue={profile.rate_per_reel ?? ""}
        />
      </div>
      <fieldset className="space-y-3">
        <legend className="mb-2 text-sm font-medium text-ink-700">Your three best pieces of work (links)</legend>
        {[0, 1, 2].map((i) => (
          <input
            key={i}
            name="portfolio_urls"
            type="url"
            defaultValue={profile.portfolio_urls[i] ?? ""}
            placeholder="https://www.instagram.com/reel/…"
            aria-label={`Portfolio link ${i + 1}`}
            maxLength={300}
            className="w-full rounded-xl border border-ink-950/10 bg-white px-4 py-3 text-base placeholder:text-ink-500/70 focus:border-sunset-500 focus:outline-none focus:ring-2 focus:ring-sunset-500/20"
          />
        ))}
      </fieldset>
      <FormAlert error={state?.error} message={state?.saved ? "Profile saved." : undefined} />
      <Button type="submit" variant="accent" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
