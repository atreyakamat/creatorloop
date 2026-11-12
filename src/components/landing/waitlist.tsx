"use client";

import { useState } from "react";
import { Check, MessageCircle } from "lucide-react";
import { Button, Field, cn } from "@/components/ui";

type Role = "business" | "creator";
type State = "idle" | "sending" | "done" | "failed";

// Collects early sign-ups through Netlify Forms (registered in public/__forms.html).
// If the form can't be reached, people are pointed to WhatsApp so no lead is lost.
export function Waitlist({ whatsapp }: { whatsapp: string | null }) {
  // Lazy init: ?as=creator pre-selects the creator option (client component, so window exists on first render).
  const [role, setRole] = useState<Role>(() =>
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("as") === "creator"
      ? "creator"
      : "business",
  );
  const [state, setState] = useState<State>("idle");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    const data = new FormData(event.currentTarget);
    try {
      const res = await fetch("/__forms.html", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(data as unknown as Record<string, string>).toString(),
      });
      setState(res.ok ? "done" : "failed");
    } catch {
      setState("failed");
    }
  }

  return (
    <section id="waitlist" className="scroll-mt-6 bg-ink-950 py-20 text-sand-50">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-sunset-400">Opening soon</p>
          <h2 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">Get in before we open.</h2>
          <p className="mt-3 max-w-md text-sand-200/75">
            We&apos;re starting with a small group of Goa businesses and creators. Leave your details and we&apos;ll
            message you on WhatsApp when your spot is ready.
          </p>
          <ul className="mt-6 space-y-2 text-sand-200/90">
            {["No payment now", "First briefs go to the first sign-ups", "One message from us, no spam"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <Check className="size-4 text-sunset-400" aria-hidden /> {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[var(--radius-card)] bg-sand-50 p-6 text-ink-950">
          {state === "done" ? (
            <div role="status" className="py-8 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-palm-500/15">
                <Check className="size-6 text-palm-500" aria-hidden />
              </div>
              <p className="mt-4 font-display text-3xl">You&apos;re on the list.</p>
              <p className="mt-2 text-ink-500">We&apos;ll message you on WhatsApp as soon as we open.</p>
            </div>
          ) : (
            <form name="waitlist" onSubmit={onSubmit} className="space-y-4">
              <input type="hidden" name="form-name" value="waitlist" />
              <p className="hidden" aria-hidden>
                <label>
                  Leave this empty <input name="bot-field" tabIndex={-1} autoComplete="off" />
                </label>
              </p>
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-ink-700">I am a</legend>
                <div className="grid grid-cols-2 gap-2">
                  {(["business", "creator"] as const).map((r) => (
                    <label
                      key={r}
                      className={cn(
                        "cursor-pointer rounded-xl border px-4 py-3 text-center text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sunset-500",
                        role === r ? "border-ink-950 bg-ink-950 text-sand-50" : "border-ink-950/10 bg-white",
                      )}
                    >
                      <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} className="sr-only" />
                      {r === "business" ? "Business owner" : "Creator"}
                    </label>
                  ))}
                </div>
              </fieldset>
              <Field label="Your name" name="name" autoComplete="name" required maxLength={80} />
              <Field
                label={role === "business" ? "Business name" : "Instagram handle"}
                name="business"
                required
                maxLength={80}
                placeholder={role === "business" ? "Your café, hotel or shop" : "@yourhandle"}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="WhatsApp number" name="phone" type="tel" autoComplete="tel" required maxLength={20} placeholder="+91" />
                <Field label="Area in Goa" name="area" maxLength={60} placeholder="Assagao, Panjim…" />
              </div>
              {state === "failed" ? (
                <p role="alert" className="rounded-xl bg-sunset-500/10 px-4 py-3 text-sm text-sunset-600">
                  That didn&apos;t go through. {whatsapp ? "Message us on WhatsApp instead and we'll add you." : "Please try again in a moment."}
                </p>
              ) : null}
              <Button type="submit" variant="accent" disabled={state === "sending"} className="w-full">
                {state === "sending" ? "Sending…" : "Join the waitlist"}
              </Button>
              {whatsapp ? (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-sm font-medium text-ink-700 underline-offset-4 hover:underline"
                >
                  <MessageCircle className="size-4" aria-hidden /> Or message us on WhatsApp
                </a>
              ) : null}
              <p className="text-center text-xs text-ink-500">
                We use these details only to contact you about CreatorLoop. See our{" "}
                <a href="/privacy" className="underline underline-offset-4">
                  Privacy Policy
                </a>
                .
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
