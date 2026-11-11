import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RefreshCw, Send, Sparkles, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { BackLink, Card } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { BriefContent, SectionTitle, formatDay } from "@/components/brief-content";
import { ReelPlayer, ReelStatus } from "@/components/reel";
import { businessNav } from "@/components/nav-links";
import { ReviewForm } from "./review-form";
import { StatusBadge } from "@/components/status-badge";
import { getMyBrief } from "@/lib/business";
import { MAX_AI_GENERATIONS, aiBriefSchema, briefAnswersSchema, goalLabel } from "@/lib/briefs";
import { regenerateBrief, setBriefStatus } from "../../actions";

export const metadata: Metadata = { title: "Brief" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ai?: string; plan?: string }>;
};

export default function BriefPage({ params, searchParams }: Props) {
  return (
    <AppShell nav={businessNav}>
      <BriefView params={params} searchParams={searchParams} />
    </AppShell>
  );
}

const aiMessages: Record<string, string> = {
  not_configured: "AI writing isn't available right now. Your answers are saved, so please try again later.",
  limit: "You've reached the AI limit for now. Try again tomorrow, or send the brief as it is.",
  failed: "The AI couldn't write this brief just now. Your answers are saved, so try again in a moment.",
};

const planMessages: Record<string, string> = {
  required: "Your brief is saved. To send it to creators, activate a plan.",
  limit: "This brief needs more reels than you have left this month.",
  failed: "Couldn't send this brief just now. Please try again.",
};

async function BriefView({ params, searchParams }: Props) {
  const [{ id }, { ai, plan }] = await Promise.all([params, searchParams]);
  const found = await getMyBrief(id);
  if (!found) notFound();

  const { brief, creator, submissions } = found;
  const parsedAi = aiBriefSchema.safeParse(brief.ai_brief);
  const content = parsedAi.success ? parsedAi.data : null;
  const answers = briefAnswersSchema.safeParse(brief.answers);
  const rewritesLeft = Math.max(0, MAX_AI_GENERATIONS - brief.ai_generations);
  const canEdit = brief.status === "draft";
  const approvedCount = submissions.filter((s) => s.status === "approved").length;

  const reels =
    brief.assigned_creator_id || submissions.length ? (
      <Card className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle>Reels</SectionTitle>
          <span className="mb-4 text-sm text-ink-500">
            {approvedCount} of {brief.deliverables} approved
          </span>
        </div>
        {creator ? (
          <p className="text-ink-700">
            Creator: <span className="font-medium">{creator.display_name || "Assigned"}</span>
            {creator.instagram ? <span className="text-ink-500"> · @{creator.instagram}</span> : null}
            {creator.is_verified ? <span className="text-palm-500"> · Verified</span> : null}
          </p>
        ) : null}
        {submissions.length ? (
          <ul className="mt-2 space-y-5">
            {submissions.map((s) => (
              <li key={s.id} className="flex flex-col gap-4 border-t border-ink-950/8 pt-5 sm:flex-row">
                <ReelPlayer url={s.url} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <ReelStatus status={s.status} />
                    <span className="text-sm text-ink-500">Delivered {formatDay(s.created_at)}</span>
                  </div>
                  {s.caption ? <p className="mt-3 whitespace-pre-line text-ink-700">{s.caption}</p> : null}
                  {s.status === "pending" ? (
                    <ReviewForm submissionId={s.id} />
                  ) : s.feedback ? (
                    <p className="mt-3 rounded-xl bg-sand-100 p-3 text-sm text-ink-900">
                      <span className="font-medium">Your feedback: </span>
                      {s.feedback}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink-500">No reels yet. They&apos;ll appear here as soon as the creator uploads.</p>
        )}
      </Card>
    ) : null;

  return (
    <div className="max-w-3xl">
      <BackLink href="/business">All briefs</BackLink>

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={brief.status} />
        <span className="text-sm text-ink-500">
          {brief.deliverables} reel{brief.deliverables === 1 ? "" : "s"}
          {brief.due_date ? ` · needed by ${formatDay(brief.due_date)}` : ""}
        </span>
      </div>
      <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">{content?.title ?? brief.title}</h1>

      {ai && aiMessages[ai] ? (
        <p role="alert" className="mt-6 rounded-xl bg-sunset-500/10 px-4 py-3 text-sm text-sunset-600">
          {aiMessages[ai]}
        </p>
      ) : null}

      {reels}

      {plan && planMessages[plan] ? (
        <div role="alert" className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-sunset-500/10 px-4 py-3 text-sm text-sunset-600">
          <span>{planMessages[plan]}</span>
          <Link href="/business/billing" className="font-medium underline underline-offset-4">
            See plans
          </Link>
        </div>
      ) : null}

      {content ? (
        <div className="mt-8">
          <BriefContent content={content} />
        </div>
      ) : (
        <Card className="mt-8 text-center">
          <Sparkles className="mx-auto size-6 text-sunset-500" aria-hidden />
          <p className="mt-3 font-medium">Your brief hasn&apos;t been written yet.</p>
          <p className="mt-1 text-sm text-ink-500">Your answers are saved. Generate it when you&apos;re ready.</p>
        </Card>
      )}

      {answers.success ? (
        <details className="mt-6 rounded-2xl border border-ink-950/8 bg-white p-5">
          <summary className="cursor-pointer font-medium">Your answers</summary>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <Answer label="Goal" value={goalLabel(answers.data.goal)} />
            <Answer label="Show off" value={answers.data.feature} />
            <Answer label="What makes you different" value={answers.data.difference} />
            <Answer label="Offer" value={answers.data.offer || "None"} />
            <Answer label="Vibe" value={answers.data.vibes.join(", ")} />
          </dl>
        </details>
      ) : null}

      {canEdit ? (
        <div className="sticky bottom-0 -mx-5 mt-8 flex flex-wrap items-center gap-3 border-t border-ink-950/5 bg-sand-50/90 px-5 py-4 backdrop-blur">
          {content ? (
            <form action={setBriefStatus.bind(null, brief.id, "open")}>
              <SubmitButton variant="accent" pendingText="Sending…">
                <Send className="size-4" aria-hidden /> Send to creators
              </SubmitButton>
            </form>
          ) : null}
          {rewritesLeft > 0 ? (
            <form action={regenerateBrief.bind(null, brief.id)}>
              <SubmitButton variant="outline" pendingText="Writing… (about 15 seconds)">
                <RefreshCw className="size-4" aria-hidden />
                {content ? `Rewrite (${rewritesLeft} left)` : "Write my brief"}
              </SubmitButton>
            </form>
          ) : null}
          <form action={setBriefStatus.bind(null, brief.id, "cancelled")} className="ml-auto">
            <SubmitButton variant="ghost" pendingText="Cancelling…" className="text-ink-500">
              <X className="size-4" aria-hidden /> Cancel brief
            </SubmitButton>
          </form>
        </div>
      ) : brief.status === "open" ? (
        <p className="mt-8 rounded-2xl bg-sea-500/10 p-5 text-sea-600">
          We&apos;re matching this brief with a local creator. This page updates as soon as someone is assigned.
        </p>
      ) : null}
    </div>
  );
}

function Answer({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-ink-500">{label}</dt>
      <dd className="mt-0.5 text-ink-900">{value}</dd>
    </div>
  );
}
