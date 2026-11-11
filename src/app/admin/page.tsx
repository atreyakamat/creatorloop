import type { Metadata } from "next";
import Link from "next/link";
import { AppShell, Greeting } from "@/components/app-shell";
import { adminNav } from "@/components/nav-links";
import { Card } from "@/components/ui";
import { formatInr } from "@/components/brief-content";
import { getOverview } from "@/lib/admin";

export const metadata: Metadata = { title: "Admin" };

export default function AdminPage() {
  return (
    <AppShell nav={adminNav}>
      <AdminHome />
    </AppShell>
  );
}

async function AdminHome() {
  const o = await getOverview();
  const queues = [
    { label: "Need a creator", value: o.open, href: "/admin/briefs?status=open", urgent: o.open > 0 },
    { label: "Ready to pay out", value: o.approved, href: "/admin/briefs?status=approved", urgent: o.approved > 0 },
    { label: "Creator working", value: o.assigned, href: "/admin/briefs?status=assigned" },
    { label: "With the business", value: o.inReview, href: "/admin/briefs?status=in_review" },
  ];
  const totals = [
    { label: "Businesses", value: String(o.businesses), href: "/admin/businesses" },
    { label: "Creators", value: String(o.creators), href: "/admin/creators" },
    { label: "Completed briefs", value: String(o.completed), href: "/admin/briefs?status=completed" },
    { label: "Payouts pending", value: formatInr(o.pendingPayouts), href: "/admin/payouts" },
  ];

  return (
    <>
      <Greeting user={o.user}>Everything running through the loop.</Greeting>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-500">Needs you</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {queues.map((q) => (
          <Link key={q.label} href={q.href}>
            <Card className={q.urgent ? "border-sunset-500/40 bg-sunset-500/5" : undefined}>
              <p className="text-sm text-ink-500">{q.label}</p>
              <p className="mt-2 font-display text-5xl tabular-nums">{q.value}</p>
            </Card>
          </Link>
        ))}
      </div>
      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wider text-ink-500">Totals</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {totals.map((t) => (
          <Link key={t.label} href={t.href}>
            <Card>
              <p className="text-sm text-ink-500">{t.label}</p>
              <p className="mt-2 font-display text-4xl tabular-nums">{t.value}</p>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
