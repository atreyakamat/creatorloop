import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock, Music, RefreshCw, Send, Sparkles, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { BackLink, Card } from "@/components/ui";
import { CopyButton, SubmitButton } from "@/components/submit-button";
import { StatusBadge } from "@/components/status-badge";
import { getMyBrief } from "@/lib/business";
import { MAX_AI_GENERATIONS, aiBriefSchema, briefAnswersSchema, goalLabel } from "@/lib/briefs";
import { regenerateBrief, setBriefStatus } from "../../actions";

export const metadata: Metadata = { title: "Brief" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ai?: string }>;
};

export default function BriefPage({ params, searchParams }: Props) {
  return (
    <AppShell>
      <BriefView params={params} searchParams={searchParams} />
    </AppShell>
  );
}

const aiMessages: Record<string, string> = {
  not_configured: "AI isn't switched on yet. Add ANTHROPIC_API_KEY to the server environment, then try again.",
  limit: "You've used all the rewrites for this brief.",
  failed: "The AI couldn't write this brief just now. Your answers are saved, so try again in a moment.",
};

async function BriefView({ params, searchParams }: Props) {
  const [{ id }, { ai }] = await Promise.all([params, searchParams]);
  const found = await getMyBrief(id);
  if (!found) notFound();

  const { brief } = found;
  const parsedAi = aiBriefSchema.safeParse(brief.ai_brief);
  const content = parsedAi.success ? parsedAi.data : null;
  const answers = briefAnswersSchema.safeParse(brief.answers);
  const rewritesLeft = Math.max(0, MAX_AI_GENERATIONS - brief.ai_generations);
  const canEdit = brief.status === "draft";
  const totalSeconds = content?.shots.reduce((sum, s) => sum + s.seconds, 0) ?? 0;

  return (
    <div className="max-w-3xl">
      <BackLink href="/business">All briefs</BackLink>

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={brief.status} />
        <span className="text-sm text-ink-500">
          {brief.deliverables} reel{brief.deliverables === 1 ? "" : "s"}
          {brief.due_date ? ` · needed by ${formatDate(brief.due_date)}` : ""}
        </span>
      </div>
      <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">{content?.title ?? brief.title}</h1>

      {ai && aiMessages[ai] ? (
        <p role="alert" className="mt-6 rounded-xl bg-sunset-500/10 px-4 py-3 text-sm text-sunset-600">
          {aiMessages[ai]}
        </p>
      ) : null}

      {content ? (
        <div className="mt-8 space-y-6">
          <Card>
            <SectionTitle icon={<Sparkles className="size-4" />}>The idea</SectionTitle>
            <p className="text-lg leading-relaxed text-ink-900">{content.concept}</p>
          </Card>

          <Card>
            <SectionTitle>Hooks for the first 2 seconds</SectionTitle>
            <ol className="space-y-2">
              {content.hooks.map((h, i) => (
                <li key={i} className="flex items-start justify-between gap-3 rounded-xl bg-sand-50 p-3">
                  <span className="font-medium">“{h}”</span>
                  <CopyButton text={h} />
                </li>
              ))}
            </ol>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <SectionTitle>Shot list</SectionTitle>
              <span className="mb-4 inline-flex items-center gap-1 text-sm text-ink-500">
                <Clock className="size-4" aria-hidden /> ~{totalSeconds}s
              </span>
            </div>
            <ol className="space-y-3">
              {content.shots.map((s, i) => (
                <li key={i} className="flex gap-4">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ink-950 text-xs font-semibold text-sand-50">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {s.shot} <span className="font-normal text-ink-500">· {s.seconds}s</span>
                    </p>
                    <p className="mt-0.5 text-sm text-ink-500">{s.direction}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <Card>
            <SectionTitle>Captions</SectionTitle>
            <div className="space-y-3">
              {content.captions.map((c, i) => (
                <div key={i} className="rounded-xl bg-sand-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="whitespace-pre-line">{c}</p>
                    <CopyButton text={`${c}\n\n${content.hashtags.join(" ")}`} />
                  </div>
                </div>
              ))}
              <p className="text-sm text-sea-600">{content.hashtags.join(" ")}</p>
            </div>
          </Card>

          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <SectionTitle icon={<Music className="size-4" />}>Audio</SectionTitle>
              <p className="text-ink-700">{content.audio}</p>
            </Card>
            <Card>
              <SectionTitle icon={<Clock className="size-4" />}>When to post</SectionTitle>
              <p className="text-ink-700">{content.post_timing}</p>
            </Card>
          </div>

          <Card className="bg-sand-100">
            <SectionTitle>Notes for the creator</SectionTitle>
            <p className="text-ink-700">{content.creator_notes}</p>
          </Card>
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

function SectionTitle({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-ink-500">
      {icon}
      {children}
    </h2>
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

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
