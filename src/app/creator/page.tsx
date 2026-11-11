import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CircleAlert } from "lucide-react";
import { AppShell, Greeting } from "@/components/app-shell";
import { creatorNav } from "@/components/nav-links";
import { ButtonLink, Card } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { formatDay, formatInr } from "@/components/brief-content";
import { getMyAssignedBriefs, getMyCreator, getMyPayouts, getOpenBriefs } from "@/lib/creator";
import { profileComplete } from "@/lib/creators";

export const metadata: Metadata = { title: "Creator" };

export default function CreatorPage() {
  return (
    <AppShell nav={creatorNav}>
      <CreatorHome />
    </AppShell>
  );
}

async function CreatorHome() {
  const { user, profile } = await getMyCreator();
  const [assigned, open, payouts] = await Promise.all([
    getMyAssignedBriefs(user.id),
    getOpenBriefs(user.id),
    getMyPayouts(user.id),
  ]);
  const complete = profileComplete(profile);
  const active = assigned.filter((b) => b.status === "assigned" || b.status === "in_review");
  const earned = payouts.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount_inr, 0);
  const pending = payouts.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount_inr, 0);

  return (
    <>
      <Greeting user={user}>
        Get paid to make content for Goa&apos;s cafés, hotels and shops. Good work matters more than follower count.
      </Greeting>

      {!complete ? (
        <Card className="mb-8 flex flex-wrap items-center justify-between gap-4 border-sunset-500/30 bg-sunset-500/5">
          <p className="flex items-center gap-2 font-medium">
            <CircleAlert className="size-5 text-sunset-500" aria-hidden />
            Finish your profile to apply for briefs.
          </p>
          <ButtonLink href="/creator/profile" variant="accent" className="px-4 py-2">
            Complete profile <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
        </Card>
      ) : null}

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Active briefs" value={String(active.length)} />
        <Stat label="Earned" value={formatInr(earned)} />
        <Stat label="Payout pending" value={formatInr(pending)} />
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-500">Your briefs</h2>
      {assigned.length ? (
        <ul className="mb-8 space-y-3">
          {assigned.map((b) => (
            <li key={b.id}>
              <Link
                href={`/creator/briefs/${b.id}`}
                className="flex items-center justify-between gap-4 rounded-2xl border border-ink-950/8 bg-white p-5 hover:border-ink-950/20"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{b.title}</p>
                  <p className="mt-1 text-sm text-ink-500">
                    {b.business?.name ?? "Business"} · {b.deliverables} reel{b.deliverables === 1 ? "" : "s"}
                    {b.due_date ? ` · due ${formatDay(b.due_date)}` : ""}
                  </p>
                </div>
                <StatusBadge status={b.status} viewer="creator" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Card className="mb-8 text-ink-500">Nothing assigned yet. Apply to an open brief to get started.</Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-ink-700">
          <span className="font-semibold">{open.length}</span> open brief{open.length === 1 ? "" : "s"} right now
        </p>
        <ButtonLink href="/creator/briefs" className="px-4 py-2">
          Browse briefs <ArrowRight className="size-4" aria-hidden />
        </ButtonLink>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-sm text-ink-500">{label}</p>
      <p className="mt-2 font-display text-4xl tabular-nums">{value}</p>
    </Card>
  );
}
