"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Store, Clapperboard } from "lucide-react";
import { signUp, type AuthState } from "../actions";
import { Button, Field, cn } from "@/components/ui";
import { FormAlert } from "../form-alert";

const roles = [
  { value: "business", label: "I run a business", sub: "Café, restaurant, hotel, shop", Icon: Store },
  { value: "creator", label: "I create content", sub: "Reels, photos, UGC", Icon: Clapperboard },
] as const;

type Role = (typeof roles)[number]["value"];

export function SignupForm() {
  const params = useSearchParams();
  const initial: Role = params.get("as") === "creator" ? "creator" : "business";
  const [role, setRole] = useState<Role>(initial);
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, undefined);

  return (
    <form action={action} className="space-y-4">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink-700">I am joining as</legend>
        <div className="grid grid-cols-2 gap-3">
          {roles.map(({ value, label, sub, Icon }) => {
            const active = role === value;
            return (
              <label
                key={value}
                className={cn(
                  "relative cursor-pointer rounded-2xl border p-4 transition-colors",
                  active ? "border-ink-950 bg-white" : "border-ink-950/10 bg-white/50 hover:bg-white",
                )}
              >
                <input
                  type="radio"
                  name="role"
                  value={value}
                  checked={active}
                  onChange={() => setRole(value)}
                  className="sr-only"
                />
                {active ? (
                  <motion.span
                    layoutId="role-ring"
                    className="absolute inset-0 rounded-2xl ring-2 ring-sunset-500"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                ) : null}
                <Icon className="mb-3 size-5 text-sunset-500" aria-hidden />
                <span className="block text-sm font-semibold">{label}</span>
                <span className="mt-0.5 block text-xs text-ink-500">{sub}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <Field label="Full name" name="full_name" autoComplete="name" required />
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <Field
        label="WhatsApp number"
        name="phone"
        type="tel"
        autoComplete="tel"
        placeholder="+91"
        hint="Optional. We use it for brief and delivery updates."
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        hint="At least 8 characters."
      />
      <FormAlert error={state?.error} message={state?.message} />
      <Button type="submit" variant="accent" disabled={pending} className="w-full">
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
