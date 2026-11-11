"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/env";
import { safeRedirectPath } from "@/lib/safe";

export type AuthState = { error?: string; message?: string } | undefined;

const signUpSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your name").max(120),
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(72, "Password is too long"),
  role: z.enum(["business", "creator"]),
  phone: z.string().trim().max(20).optional(),
});

const signInSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export async function signUp(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { email, password, ...meta } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: meta, // read by the handle_new_user trigger
      emailRedirectTo: `${siteUrl()}/auth/confirm?next=/dashboard`,
    },
  });
  if (error) {
    // Don't echo provider internals; keep the two cases a user can act on.
    if (error.code === "weak_password") return { error: "Choose a stronger password." };
    if (error.code === "over_email_send_rate_limit" || error.status === 429) {
      return { error: "Too many attempts. Please wait a minute and try again." };
    }
    return { error: "Couldn't create the account. If you already have one, log in instead." };
  }

  // Email confirmation on: no session yet.
  if (!data.session) {
    return { message: "Check your inbox to confirm your email, then log in." };
  }
  redirect("/dashboard");
}

export async function signIn(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Wrong email or password." };

  redirect(safeRedirectPath(formData.get("next")));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

// ─── Password reset ─────────────────────────────────────────────────────────

export async function requestPasswordReset(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = z.object({ email: z.email("Enter a valid email") }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl()}/auth/confirm?next=/reset-password`,
  });
  if (error?.status === 429) return { error: "Too many attempts. Please wait a minute and try again." };
  // Same answer whether or not the account exists, so emails can't be probed.
  return { message: "If that email has an account, a reset link is on its way." };
}

export async function updatePassword(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = z
    .object({
      password: z.string().min(8, "Password must be at least 8 characters").max(72, "Password is too long"),
      confirm: z.string(),
    })
    .refine((v) => v.password === v.confirm, "The two passwords don't match")
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect("/login");

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { error: error.code === "weak_password" ? "Choose a stronger password." : "Couldn't update the password. Open the reset link again." };
  }
  redirect("/dashboard");
}
