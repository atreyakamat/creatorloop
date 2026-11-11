"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center bg-sand-50 px-5 text-center">
      <div>
        <h1 className="font-display text-5xl">Something went wrong</h1>
        <p className="mt-3 text-ink-500">Nothing was lost. Try again, and if it keeps happening, let us know.</p>
        {error.digest ? <p className="mt-2 text-xs text-ink-500">Reference: {error.digest}</p> : null}
        <Button onClick={reset} className="mt-8">
          Try again
        </Button>
      </div>
    </main>
  );
}
