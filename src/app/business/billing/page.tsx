import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Check, MessageCircle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { businessNav } from "@/components/nav-links";
import { Card, cn } from "@/components/ui";
import { SectionTitle, formatDay, formatInr } from "@/components/brief-content";
import { plans, planName, upiLink, whatsappLink } from "@/config/site";
import { monthLabel } from "@/lib/ai-docs";
import { getInvoices, getUsage } from "@/lib/billing";
import { getMyBusiness } from "@/lib/business";

export const metadata: Metadata = { title: "Plan and billing" };

export default function BillingPage() {
  return (
    <AppShell nav={businessNav}>
      <Billing />
    </AppShell>
  );
}

async function Billing() {
  const { business } = await getMyBusiness();
  if (!business) redirect("/business/onboarding");
  const [usage, invoices] = await Promise.all([getUsage(business), getInvoices(business.id)]);

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-4xl leading-tight sm:text-5xl">Plan and billing</h1>

      <Card className="mt-8">
        <SectionTitle>Your plan</SectionTitle>
        {usage.active ? (
          <>
            <p className="font-display text-3xl">{planName(business.plan)}</p>
            <p className="mt-2 text-ink-700">
              {usage.used} of {usage.allowance} reels used this month · {usage.left} left
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-sand-100" aria-hidden>
              <div
                className="h-full rounded-full bg-sunset-500"
                style={{ width: `${usage.allowance ? Math.min(100, (usage.used / usage.allowance) * 100) : 0}%` }}
              />
            </div>
          </>
        ) : (
          <p className="text-ink-700">
            You don&apos;t have a plan yet. You can write briefs for free; pick a plan to send them to creators.
          </p>
        )}
      </Card>

      {!usage.active ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {plans
            .filter((p) => p.priceInr !== null)
            .map((p) => {
              const wa = whatsappLink(`Hi! I'd like the ${p.name} plan for ${business.name} on CreatorLoop.`);
              return (
                <Card key={p.id} className={cn(p.highlighted && "border-sunset-500/40")}>
                  <p className="font-semibold">{p.name}</p>
                  <p className="mt-2">
                    <span className="font-display text-4xl">{p.price}</span>
                    <span className="text-ink-500">{p.period}</span>
                  </p>
                  <ul className="mt-4 space-y-2 text-sm">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-palm-500" aria-hidden /> {f}
                      </li>
                    ))}
                  </ul>
                  {wa ? (
                    <a
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink-950 px-5 py-3 text-sm font-medium text-sand-50 hover:bg-ink-900"
                    >
                      <MessageCircle className="size-4" aria-hidden /> Choose {p.name} on WhatsApp
                    </a>
                  ) : (
                    <p className="mt-5 text-sm text-ink-500">Message us to activate this plan.</p>
                  )}
                </Card>
              );
            })}
        </div>
      ) : null}

      <Card className="mt-6">
        <SectionTitle>Invoices</SectionTitle>
        {invoices.length ? (
          <ul className="divide-y divide-ink-950/8">
            {invoices.map((inv) => {
              const month = monthLabel(inv.period.slice(0, 7));
              const pay = inv.status === "due" ? upiLink(inv.amount_inr, `CreatorLoop ${month}`) : null;
              return (
                <li key={inv.id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
                  <div>
                    <p className="font-medium">
                      {month} · <span className="tabular-nums">{formatInr(inv.amount_inr)}</span>
                    </p>
                    <p className="text-sm text-ink-500">
                      {inv.status === "paid" && inv.paid_at ? `Paid ${formatDay(inv.paid_at)}` : "Due now"}
                      {inv.note ? ` · ${inv.note}` : ""}
                    </p>
                  </div>
                  {inv.status === "paid" ? (
                    <span className="rounded-full bg-palm-500/15 px-2.5 py-1 text-xs font-medium text-palm-500">Paid</span>
                  ) : pay ? (
                    <a href={pay} className="rounded-full bg-sunset-500 px-4 py-2 text-sm font-medium text-white hover:bg-sunset-600">
                      Pay by UPI
                    </a>
                  ) : (
                    <span className="rounded-full bg-sand-100 px-2.5 py-1 text-xs font-medium text-ink-700">Due</span>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-ink-500">No invoices yet.</p>
        )}
        <p className="mt-4 text-sm text-ink-500">
          Pay by UPI works on a phone with a UPI app. We mark the invoice paid once the payment arrives.
        </p>
      </Card>
    </div>
  );
}
