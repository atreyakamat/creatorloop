import type { ReactNode } from "react";
import { Logo } from "@/components/ui";
import { contactEmail, whatsappLink } from "@/config/site";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  const email = contactEmail();
  const wa = whatsappLink();
  return (
    <div className="min-h-dvh bg-sand-50">
      <header className="mx-auto w-full max-w-3xl px-5 py-5">
        <Logo />
      </header>
      <main className="mx-auto max-w-3xl px-5 pb-20 pt-6">
        <h1 className="font-display text-5xl leading-tight">{title}</h1>
        <p className="mt-2 text-sm text-ink-500">Last updated {updated}</p>
        <div className="mt-8 space-y-8">{children}</div>
        <section className="mt-10 rounded-2xl bg-white p-5 text-ink-700">
          <h2 className="font-semibold text-ink-950">Contact</h2>
          <p className="mt-1">
            {email ? (
              <>
                Email{" "}
                <a href={`mailto:${email}`} className="underline underline-offset-4">
                  {email}
                </a>
                .
              </>
            ) : wa ? (
              <>
                Message us on{" "}
                <a href={wa} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                  WhatsApp
                </a>
                .
              </>
            ) : (
              "Reach us through the contact details on the home page."
            )}
          </p>
        </section>
      </main>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-2 space-y-3 leading-relaxed text-ink-700 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">{children}</div>
    </section>
  );
}
