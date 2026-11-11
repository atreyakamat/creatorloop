import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { creatorNav } from "@/components/nav-links";
import { BackLink, Card } from "@/components/ui";
import { BriefContent, SectionTitle, formatDay, formatInr } from "@/components/brief-content";
import { ReelPlayer, ReelStatus } from "@/components/reel";
import { StatusBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";
import { getCreatorBrief } from "@/lib/creator";
import { profileComplete } from "@/lib/creators";
import { aiBriefSchema } from "@/lib/briefs";
import { withdrawApplication } from "../../actions";
import { ApplyForm } from "./apply-form";
import { ReelUploader } from "./reel-uploader";

export const metadata: Metadata = { title: "Brief" };

type Props = { params: Promise<{ id: string }> };

export default function CreatorBriefPage({ params }: Props) {
  return (
    <AppShell nav={creatorNav}>
      <CreatorBrief params={params} />
    </AppShell>
  );
}

async function CreatorBrief({ params }: Props) {
  const { id } = await params;
  const found = await getCreatorBrief(id);
  if (!found) notFound();

  const { user, profile, brief, business, mine, application, submissions } = found;
  const parsed = aiBriefSchema.safeParse(brief.ai_brief);
  const approved = submissions.filter((s) => s.status === "approved").length;
  const canUpload = mine && (brief.status === "assigned" || brief.status === "in_review");

  return (
    <div className="max-w-3xl">
      <BackLink href={mine ? "/creator" : "/creator/briefs"}>{mine ? "Home" : "Open briefs"}</BackLink>

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={brief.status} viewer="creator" />
        <span className="text-sm text-ink-500">
          {brief.deliverables} reel{brief.deliverables === 1 ? "" : "s"}
          {brief.due_date ? ` · due ${formatDay(brief.due_date)}` : ""}
          {mine && brief.budget_inr ? ` · ${formatInr(brief.budget_inr)} for this brief` : ""}
        </span>
      </div>
      <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">{brief.title}</h1>
      {business ? (
        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-ink-700">
          <span className="font-medium">{business.name}</span>
          <span className="text-ink-500">{business.category}</span>
          {business.area ? (
            <span className="inline-flex items-center gap-1 text-ink-500">
              <MapPin className="size-4" aria-hidden /> {business.area}
            </span>
          ) : null}
          {business.instagram ? <span className="text-ink-500">@{business.instagram}</span> : null}
        </p>
      ) : null}

      {mine ? (
        <Card className="mt-8">
          <div className="flex items-center justify-between gap-3">
            <SectionTitle>Your reels</SectionTitle>
            <span className="mb-4 text-sm text-ink-500">
              {approved} of {brief.deliverables} approved
            </span>
          </div>
          {canUpload ? (
            <ReelUploader briefId={brief.id} userId={user.id} />
          ) : (
            <p className="rounded-xl bg-palm-500/10 p-4 text-palm-500">
              {brief.status === "completed"
                ? "This brief is complete. Thank you!"
                : "All reels for this brief are approved. Your payout will show under Earnings."}
            </p>
          )}
          {submissions.length ? (
            <ul className="mt-6 space-y-5">
              {submissions.map((s) => (
                <li key={s.id} className="flex flex-col gap-4 border-t border-ink-950/8 pt-5 sm:flex-row">
                  <ReelPlayer url={s.url} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <ReelStatus status={s.status} />
                      <span className="text-sm text-ink-500">Uploaded {formatDay(s.created_at)}</span>
                    </div>
                    {s.caption ? <p className="mt-3 whitespace-pre-line text-ink-700">{s.caption}</p> : null}
                    {s.feedback ? (
                      <p className="mt-3 rounded-xl bg-sand-100 p-3 text-sm text-ink-900">
                        <span className="font-medium">Feedback: </span>
                        {s.feedback}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </Card>
      ) : (
        <Card className="mt-8">
          {application ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-medium">You&apos;ve applied for this brief.</p>
                <p className="mt-1 text-sm text-ink-500">We&apos;ll assign a creator soon. It will show on your home page.</p>
              </div>
              <form action={withdrawApplication.bind(null, brief.id)}>
                <SubmitButton variant="outline" pendingText="Withdrawing…" className="px-4 py-2">
                  Withdraw
                </SubmitButton>
              </form>
            </div>
          ) : (
            <ApplyForm briefId={brief.id} profileReady={profileComplete(profile)} />
          )}
        </Card>
      )}

      {parsed.success ? (
        <div className="mt-8">
          <BriefContent content={parsed.data} />
        </div>
      ) : null}
    </div>
  );
}
