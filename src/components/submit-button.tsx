"use client";

import { useFormStatus } from "react-dom";
import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui";

export function SubmitButton({
  children,
  pendingText,
  ...props
}: ComponentProps<typeof Button> & { pendingText: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? pendingText : children}
    </Button>
  );
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        const btn = e.currentTarget;
        navigator.clipboard?.writeText(text).then(() => {
          btn.textContent = "Copied";
          setTimeout(() => (btn.textContent = label), 1500);
        });
      }}
      className="shrink-0 rounded-full border border-ink-950/10 px-3 py-1 text-xs font-medium text-ink-700 hover:bg-sand-100"
    >
      {label}
    </button>
  );
}
