import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { adminNav } from "@/components/nav-links";
import { BackLink, Card } from "@/components/ui";
import { BriefContent, SectionTitle, formatDay, formatInr } from "@/components/brief-content";
import { ReelPlayer, ReelStatus } from "@/components/reel";
import { StatusBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";
import { getAdminBrief } from "@/lib/admin";
import { aiBriefSchema } from "@/lib/briefs";
import { safeHttpUrl } from "@/lib/safe";
import { cancelBriefAsAdmin, markPayoutPaid, unassignCreator } from "../../actions";
import { AssignForm, CloseForm } from "./forms";
import { MatchSuggestions } from "./match";

export const metadata: Metadata = { title: "Brief · Admin" };

type Props = { params: Promise<{ id: string }> };

export default function AdminBriefPage({ params }: Props) {
  return (
    <AppShell nav={adminNav}>
      <AdminBrief params={params} />
    </AppShell>
  );
}

async function AdminBrief({ params }: Props) {
  const { id } = await params;
  const found = await getAdminBrief(id);
  if (!found) notFound();
  const { brief, business, owner, candidates, assigned, submissions, payout } = found;
  const parsed = aiBriefSchema.safeParse(brief.ai_brief);
  const applicants = candidates.filter((c) => c.application);
  const approved = submissions.filter((s) => s.status === "approved").length;

  return (
    <div className="max-w-3xl">
      <BackLink href="/admin/briefs">All briefs</BackLink>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={brief.status} viewer="admin" />
        <span className="text-sm text-ink-500">
          {brief.deliverables} reel{brief.deliverables === 1 ? "" : "s"}
          {brief.due_date ? ` · due ${formatDay(brief.due_date)}` : ""}
          {brief.budget_inr ? ` · creator pay ${formatInr(brief.budget_inr)}` : ""}
        </span>
      </div>
      <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">{brief.title}</h1>

      {business ? (
        <Card className="mt-6">
          <SectionTitle>Business</SectionTitle>
          <p className="font-medium">{business.name}</p>
          <p className="mt-1 text-sm text-ink-500">
            {business.category}
            {business.area ? ` · ${business.area}` : ""}
            {business.instagram ? ` · @${business.instagram}` : ""}
          </p>
          {owner ? (
            <p className="mt-2 text-sm text-ink-700">
              Owner: {owner.full_name || "—"}
              {owner.phone ? ` · ${owner.phone}` : ""}
            </p>
          ) : null}
        </Card>
      ) : null}

      {brief.status === "open" ? (
        <Card className="mt-6">
          <SectionTitle>Assign a creator</SectionTitle>
          {applicants.length ? (
            <ul className="mb-5 space-y-3">
              {applicants.map((c) => (
                <li key={c.id} className="rounded-xl bg-sand-50 p-4">
                  <CreatorLine creator={c} />
                  {c.application?.note ? <p className="mt-2 text-sm text-ink-700">“{c.application.note}”</p> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-5 text-sm text-ink-500">No applications yet. You can still assign any creator with a complete profile.</p>
          )}
          {candidates.length > 1 ? <MatchSuggestions briefId={brief.id} /> : null}
          {candidates.length ? (
            <AssignForm
              briefId={brief.id}
              suggestedId={applicants.length === 1 ? applicants[0].id : undefined}
              candidates={candidates.map((c) => ({
                id: c.id,
                rate: c.rate_per_reel,
                label: `${c.display_name}${c.application ? " (applied)" : ""}${c.is_verified ? " ✓" : ""}${
                  c.rate_per_reel ? ` · ₹${c.rate_per_reel}/reel` : ""
                }`,
              }))}
            />
          ) : (
            <p className="text-sm text-ink-500">No creators with a complete profile yet.</p>
          )}
        </Card>
      ) : null}

      {assigned ? (
        <Card className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionTitle>Creator</SectionTitle>
            {brief.status === "assigned" && submissions.length === 0 ? (
              <form action={unassignCreator.bind(null, brief.id)} className="mb-4">
                <SubmitButton variant="outline" pendingText="Removing…" className="px-3 py-1.5">
                  Unassign
                </SubmitButton>
              </form>
            ) : null}
          </div>
          <CreatorLine creator={assigned} />
        </Card>
      ) : null}

      {submissions.length ? (
        <Card className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <SectionTitle>Reels</SectionTitle>
            <span className="mb-4 text-sm text-ink-500">
              {approved} of {brief.deliverables} approved
            </span>
          </div>
          <ul className="space-y-5">
            {submissions.map((s) => (
              <li key={s.id} className="flex flex-col gap-4 border-t border-ink-950/8 pt-5 first:border-0 first:pt-0 sm:flex-row">
                <ReelPlayer url={s.url} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <ReelStatus status={s.status} />
                    <span className="text-sm text-ink-500">{formatDay(s.created_at)}</span>
                  </div>
                  {s.caption ? <p className="mt-3 whitespace-pre-line text-ink-700">{s.caption}</p> : null}
                  {s.feedback ? <p className="mt-3 rounded-xl bg-sand-100 p-3 text-sm">Feedback: {s.feedback}</p> : null}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {brief.status === "approved" && !payout ? (
        <Card className="mt-6 border-sunset-500/40">
          <SectionTitle>Close and pay</SectionTitle>
          <p className="mb-4 text-sm text-ink-500">
            All reels are approved. This marks the brief complete and creates the creator&apos;s payout. Send the money
            yourself (UPI or bank), then mark the payout as paid.
          </p>
          <CloseForm
            briefId={brief.id}
            defaultAmount={brief.budget_inr ?? (assigned?.rate_per_reel ? assigned.rate_per_reel * brief.deliverables : null)}
          />
        </Card>
      ) : null}

      {payout ? (
        <Card className="mt-6">
          <SectionTitle>Payout</SectionTitle>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p>
              <span className="font-display text-3xl tabular-nums">{formatInr(payout.amount_inr)}</span>
              <span className="ml-3 text-sm text-ink-500">
                {payout.status === "paid" && payout.paid_at ? `Paid ${formatDay(payout.paid_at)}` : "Pending"}
                {payout.note ? ` · ${payout.note}` : ""}
              </span>
            </p>
            {payout.status === "pending" ? (
              <form action={markPayoutPaid.bind(null, payout.id)}>
                <SubmitButton pendingText="Saving…" className="px-4 py-2">
                  Mark as paid
                </SubmitButton>
              </form>
            ) : null}
          </div>
        </Card>
      ) : null}

      {parsed.success ? (
        <div className="mt-6">
          <BriefContent content={parsed.data} />
        </div>
      ) : (
        <Card className="mt-6 text-ink-500">The AI brief hasn&apos;t been written for this one yet.</Card>
      )}

      {["draft", "open", "assigned"].includes(brief.status) ? (
        <form action={cancelBriefAsAdmin.bind(null, brief.id)} className="mt-8">
          <SubmitButton variant="ghost" pendingText="Cancelling…" className="text-ink-500">
            Cancel this brief
          </SubmitButton>
        </form>
      ) : null}
    </div>
  );
}

function CreatorLine({
  creator,
}: {
  creator: {
    display_name: string;
    instagram: string | null;
    niches: string[];
    followers: number | null;
    rate_per_reel: number | null;
    is_verified: boolean;
    bio: string | null;
    portfolio_urls: string[];
  };
}) {
  const links = creator.portfolio_urls.map((u) => safeHttpUrl(u)).filter((u): u is string => u !== null);
  return (
    <div>
      <p className="font-medium">
        {creator.display_name}
        {creator.is_verified ? <span className="ml-2 text-sm font-normal text-palm-500">Verified</span> : null}
      </p>
      <p className="mt-1 text-sm text-ink-500">
        {creator.instagram ? `@${creator.instagram} · ` : ""}
        {creator.niches.join(", ")}
        {creator.followers ? ` · ${creator.followers.toLocaleString("en-IN")} followers` : ""}
        {creator.rate_per_reel ? ` · ${formatInr(creator.rate_per_reel)}/reel` : ""}
      </p>
      {creator.bio ? <p className="mt-2 text-sm text-ink-700">{creator.bio}</p> : null}
      {links.length ? (
        <p className="mt-2 flex flex-wrap gap-3 text-sm">
          {links.map((u, i) => (
            <a key={u} href={u} target="_blank" rel="noopener noreferrer nofollow" className="text-sea-600 underline underline-offset-4">
              Work sample {i + 1}
            </a>
          ))}
        </p>
      ) : null}
    </div>
  );
}
