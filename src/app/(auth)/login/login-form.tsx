"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, type AuthState } from "../actions";
import { Button, Field } from "@/components/ui";
import { safeRedirectPath } from "@/lib/safe";
import { FormAlert } from "@/components/form-alert";

export function LoginForm() {
  const params = useSearchParams();
  const [state, action, pending] = useActionState<AuthState, FormData>(signIn, undefined);
  const confirmError =
    params.get("error") === "confirm" ? "That link has expired. Log in or sign up again." : undefined;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={safeRedirectPath(params.get("next"))} />
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <Field label="Password" name="password" type="password" autoComplete="current-password" required />
      <FormAlert error={state?.error ?? confirmError} message={state?.message} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Logging in…" : "Log in"}
      </Button>
    </form>
  );
}
