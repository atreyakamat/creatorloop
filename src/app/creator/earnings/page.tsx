import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { creatorNav } from "@/components/nav-links";
import { Card } from "@/components/ui";
import { formatDay, formatInr } from "@/components/brief-content";
import { getMyCreator, getMyPayouts } from "@/lib/creator";

export const metadata: Metadata = { title: "Earnings" };

export default function EarningsPage() {
  return (
    <AppShell nav={creatorNav}>
      <Earnings />
    </AppShell>
  );
}

async function Earnings() {
  const { user } = await getMyCreator();
  const payouts = await getMyPayouts(user.id);
  const paid = payouts.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount_inr, 0);
  const pending = payouts.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount_inr, 0);

  return (
    <>
      <h1 className="font-display text-4xl leading-tight sm:text-5xl">Earnings</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-sm text-ink-500">Paid out</p>
          <p className="mt-2 font-display text-5xl tabular-nums">{formatInr(paid)}</p>
        </Card>
        <Card>
          <p className="text-sm text-ink-500">On the way</p>
          <p className="mt-2 font-display text-5xl tabular-nums">{formatInr(pending)}</p>
        </Card>
      </div>
      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wider text-ink-500">History</h2>
      {payouts.length ? (
        <ul className="divide-y divide-ink-950/8 rounded-2xl border border-ink-950/8 bg-white">
          {payouts.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-4 p-4">
              <div>
                <p className="font-medium tabular-nums">{formatInr(p.amount_inr)}</p>
                <p className="text-sm text-ink-500">
                  {p.status === "paid" && p.paid_at ? `Paid ${formatDay(p.paid_at)}` : `Created ${formatDay(p.created_at)}`}
                </p>
              </div>
              <span
                className={
                  p.status === "paid"
                    ? "rounded-full bg-palm-500/15 px-2.5 py-1 text-xs font-medium text-palm-500"
                    : "rounded-full bg-sand-100 px-2.5 py-1 text-xs font-medium text-ink-700"
                }
              >
                {p.status === "paid" ? "Paid" : "Pending"}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <Card className="text-ink-500">Payouts appear here once a business approves your reels.</Card>
      )}
    </>
  );
}
