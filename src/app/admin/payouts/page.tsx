import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { adminNav } from "@/components/nav-links";
import { Card } from "@/components/ui";
import { formatDay, formatInr } from "@/components/brief-content";
import { SubmitButton } from "@/components/submit-button";
import { listPayouts } from "@/lib/admin";
import { markPayoutPaid } from "../actions";

export const metadata: Metadata = { title: "Payouts · Admin" };

export default function AdminPayoutsPage() {
  return (
    <AppShell nav={adminNav}>
      <Payouts />
    </AppShell>
  );
}

async function Payouts() {
  const payouts = await listPayouts();
  const pending = payouts.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount_inr, 0);
  return (
    <>
      <h1 className="font-display text-4xl leading-tight sm:text-5xl">Payouts</h1>
      <p className="mt-2 text-ink-500">
        {formatInr(pending)} waiting to be paid. CreatorLoop tracks payouts; you send the money yourself and mark it paid here.
      </p>
      {payouts.length ? (
        <ul className="mt-6 divide-y divide-ink-950/8 rounded-2xl border border-ink-950/8 bg-white">
          {payouts.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-medium">
                  <span className="tabular-nums">{formatInr(p.amount_inr)}</span> to {p.creator?.display_name || "creator"}
                </p>
                <p className="text-sm text-ink-500">
                  {p.brief ? (
                    <Link href={`/admin/briefs/${p.brief.id}`} className="underline underline-offset-4">
                      {p.brief.title}
                    </Link>
                  ) : (
                    "No brief"
                  )}
                  {" · "}
                  {p.status === "paid" && p.paid_at ? `paid ${formatDay(p.paid_at)}` : `created ${formatDay(p.created_at)}`}
                  {p.note ? ` · ${p.note}` : ""}
                </p>
              </div>
              {p.status === "pending" ? (
                <form action={markPayoutPaid.bind(null, p.id)}>
                  <SubmitButton pendingText="Saving…" className="px-4 py-2">
                    Mark as paid
                  </SubmitButton>
                </form>
              ) : (
                <span className="rounded-full bg-palm-500/15 px-2.5 py-1 text-xs font-medium text-palm-500">Paid</span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <Card className="mt-6 text-ink-500">No payouts yet. They&apos;re created when you close an approved brief.</Card>
      )}
    </>
  );
}
