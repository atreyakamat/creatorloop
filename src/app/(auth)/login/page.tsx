import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <>
      <h1 className="font-display text-4xl leading-tight">Welcome back</h1>
      <p className="mt-2 text-ink-500">Log in to manage your briefs and content.</p>
      <div className="mt-8">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
      <p className="mt-6 text-sm text-ink-500">
        <Link href="/forgot-password" className="font-medium text-ink-950 underline underline-offset-4">
          Forgot your password?
        </Link>
      </p>
      <p className="mt-2 text-sm text-ink-500">
        New here?{" "}
        <Link href="/signup" className="font-medium text-ink-950 underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </>
  );
}
