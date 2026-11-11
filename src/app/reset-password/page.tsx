import type { Metadata } from "next";
import { Suspense } from "react";
import { Logo } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Set a new password" };

// Reached from the emailed reset link, which signs the person in first.
export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-sand-50">
      <header className="mx-auto w-full max-w-6xl px-5 py-5">
        <Logo />
      </header>
      <main className="flex flex-1 items-start justify-center px-5 pb-16 pt-6 sm:items-center sm:pt-0">
        <div className="w-full max-w-md">
          <h1 className="font-display text-4xl leading-tight">Set a new password</h1>
          <Suspense fallback={<div className="mt-8 h-48 animate-pulse rounded-2xl bg-sand-100" />}>
            <SignedIn />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

async function SignedIn() {
  const user = await requireUser();
  return (
    <>
      <p className="mt-2 text-ink-500">For {user.email ?? "your account"}.</p>
      <div className="mt-8">
        <ResetForm />
      </div>
    </>
  );
}
