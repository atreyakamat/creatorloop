import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { adminNav } from "@/components/nav-links";
import { BackLink, Card } from "@/components/ui";
import { SectionTitle, formatDay, formatInr } from "@/components/brief-content";
import { StatusBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";
import { plans } from "@/config/site";
import { currentMonth, monthLabel } from "@/lib/ai-docs";
import { getAdminBusiness } from "@/lib/admin";
import { setInvoiceStatus } from "../../actions";
import { InvoiceForm, PlanForm } from "./forms";

export const metadata: Metadata = { title: "Business · Admin" };

type Props = { params: Promise<{ id: string }> };

export default function AdminBusinessPage({ params }: Props) {
  return (
    <AppShell nav={adminNav}>
      <AdminBusiness params={params} />
    </AppShell>
  );
}

async function AdminBusiness({ params }: Props) {
  const { id } = await params;
  const found = await getAdminBusiness(id);
  if (!found) notFound();
  const { business, owner, invoices, briefs } = found;
  const planPrice = plans.find((p) => p.id === business.plan)?.priceInr ?? null;

  return (
    <div className="max-w-3xl">
      <BackLink href="/admin/businesses">All businesses</BackLink>
      <h1 className="font-display text-4xl leading-tight sm:text-5xl">{business.name}</h1>
      <p className="mt-2 text-ink-500">
        {business.category}
        {business.area ? ` · ${business.area}` : ""}
        {business.instagram ? ` · @${business.instagram}` : ""}
      </p>
      <p className="mt-1 text-ink-700">
        Owner: {owner?.full_name || "—"}
        {owner?.phone ? ` · ${owner.phone}` : ""}
      </p>

      <Card className="mt-8">
        <SectionTitle>Plan</SectionTitle>
        <p className="mb-4 text-sm text-ink-500">
          Activate a plan once the business has agreed and paid. They can send briefs to creators only with a plan.
        </p>
        <PlanForm businessId={business.id} plan={business.plan} reels={business.reels_per_month} />
      </Card>

      <Card className="mt-6">
        <SectionTitle>Invoices</SectionTitle>
        {invoices.length ? (
          <ul className="mb-6 divide-y divide-ink-950/8">
            {invoices.map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0">
                <p>
                  <span className="font-medium">{monthLabel(inv.period.slice(0, 7))}</span> ·{" "}
                  <span className="tabular-nums">{formatInr(inv.amount_inr)}</span>
                  <span className="ml-2 text-sm text-ink-500">
                    {inv.status === "paid" && inv.paid_at ? `paid ${formatDay(inv.paid_at)}` : inv.status}
                    {inv.note ? ` · ${inv.note}` : ""}
                  </span>
                </p>
                {inv.status === "due" ? (
                  <div className="flex gap-2">
                    <form action={setInvoiceStatus.bind(null, inv.id, "paid")}>
                      <SubmitButton pendingText="Saving…" className="px-4 py-2">
                        Mark paid
                      </SubmitButton>
                    </form>
                    <form action={setInvoiceStatus.bind(null, inv.id, "void")}>
                      <SubmitButton variant="ghost" pendingText="Voiding…" className="px-3 py-2 text-ink-500">
                        Void
                      </SubmitButton>
                    </form>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-6 text-ink-500">No invoices yet.</p>
        )}
        <InvoiceForm businessId={business.id} month={currentMonth()} defaultAmount={planPrice} />
      </Card>

      <Card className="mt-6">
        <SectionTitle>Briefs</SectionTitle>
        {briefs.length ? (
          <ul className="divide-y divide-ink-950/8">
            {briefs.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <Link href={`/admin/briefs/${b.id}`} className="min-w-0 truncate underline-offset-4 hover:underline">
                  {b.title}
                </Link>
                <StatusBadge status={b.status} viewer="admin" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ink-500">No briefs yet.</p>
        )}
      </Card>
    </div>
  );
}
