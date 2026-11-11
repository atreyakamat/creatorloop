"use client";

import { useActionState } from "react";
import { Button, Field } from "@/components/ui";
import { FormAlert } from "@/components/form-alert";
import { updatePassword, type AuthState } from "../(auth)/actions";

export function ResetForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(updatePassword, undefined);
  return (
    <form action={action} className="space-y-4">
      <Field label="New password" name="password" type="password" autoComplete="new-password" minLength={8} required hint="At least 8 characters." />
      <Field label="Repeat new password" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
      <FormAlert error={state?.error} />
      <Button type="submit" variant="accent" disabled={pending} className="w-full">
        {pending ? "Saving…" : "Save new password"}
      </Button>
    </form>
  );
}
