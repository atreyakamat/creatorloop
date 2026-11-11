import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <>
      <h1 className="font-display text-4xl leading-tight">Join CreatorLoop</h1>
      <p className="mt-2 text-ink-500">Free to join. Set up takes a minute.</p>
      <div className="mt-8">
        <Suspense>
          <SignupForm />
        </Suspense>
      </div>
      <p className="mt-6 text-xs text-ink-500">
        By creating an account you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-4">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-4">
          Privacy Policy
        </Link>
        .
      </p>
      <p className="mt-4 text-sm text-ink-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-ink-950 underline underline-offset-4">
          Log in
        </Link>
      </p>
    </>
  );
}
