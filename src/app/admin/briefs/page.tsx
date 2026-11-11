import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { adminNav } from "@/components/nav-links";
import { Card, cn } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { formatDay } from "@/components/brief-content";
import { BRIEF_STATUSES, listBriefs } from "@/lib/admin";

export const metadata: Metadata = { title: "Briefs · Admin" };

type Props = { searchParams: Promise<{ status?: string }> };

const labels: Record<string, string> = {
  open: "Need a creator",
  assigned: "Creator working",
  in_review: "With business",
  approved: "Ready to pay",
  completed: "Completed",
  draft: "Drafts",
  cancelled: "Cancelled",
};

export default function AdminBriefsPage({ searchParams }: Props) {
  return (
    <AppShell nav={adminNav}>
      <Briefs searchParams={searchParams} />
    </AppShell>
  );
}

async function Briefs({ searchParams }: Props) {
  const { status } = await searchParams;
  const briefs = await listBriefs(status);

  return (
    <>
      <h1 className="font-display text-4xl leading-tight sm:text-5xl">Briefs</h1>
      <div className="mt-6 flex flex-wrap gap-2">
        {[undefined, ...BRIEF_STATUSES].map((s) => (
          <Link
            key={s ?? "all"}
            href={s ? `/admin/briefs?status=${s}` : "/admin/briefs"}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm",
              status === s || (!s && !status) ? "border-ink-950 bg-ink-950 text-sand-50" : "border-ink-950/10 bg-white text-ink-700",
            )}
          >
            {s ? labels[s] : "All"}
          </Link>
        ))}
      </div>
      {briefs.length ? (
        <ul className="mt-6 space-y-3">
          {briefs.map((b) => (
            <li key={b.id}>
              <Link
                href={`/admin/briefs/${b.id}`}
                className="flex items-center justify-between gap-4 rounded-2xl border border-ink-950/8 bg-white p-5 hover:border-ink-950/20"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{b.title}</p>
                  <p className="mt-1 text-sm text-ink-500">
                    {b.business?.name ?? "Business"}
                    {b.business?.area ? `, ${b.business.area}` : ""} · {b.deliverables} reel{b.deliverables === 1 ? "" : "s"}
                    {b.creator ? ` · ${b.creator.display_name}` : ""} · {formatDay(b.created_at)}
                  </p>
                </div>
                <StatusBadge status={b.status} viewer="admin" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Card className="mt-6 text-ink-500">Nothing here.</Card>
      )}
    </>
  );
}
