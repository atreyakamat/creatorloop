import type { Metadata } from "next";
import Link from "next/link";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="font-display text-4xl leading-tight">Reset your password</h1>
      <p className="mt-2 text-ink-500">Enter your email and we&apos;ll send you a link to set a new one.</p>
      <div className="mt-8">
        <ForgotForm />
      </div>
      <p className="mt-6 text-sm text-ink-500">
        <Link href="/login" className="font-medium text-ink-950 underline underline-offset-4">
          Back to log in
        </Link>
      </p>
    </>
  );
}
