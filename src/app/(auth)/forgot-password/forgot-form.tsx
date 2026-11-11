"use client";

import { useActionState } from "react";
import { Button, Field } from "@/components/ui";
import { FormAlert } from "@/components/form-alert";
import { requestPasswordReset, type AuthState } from "../actions";

export function ForgotForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(requestPasswordReset, undefined);
  return (
    <form action={action} className="space-y-4">
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <FormAlert error={state?.error} message={state?.message} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
