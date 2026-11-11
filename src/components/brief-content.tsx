import { Clock, Music, Sparkles } from "lucide-react";
import { Card } from "@/components/ui";
import { CopyButton } from "@/components/submit-button";
import type { AiBrief } from "@/lib/briefs";

// The AI-written brief, shared by the business, creator and admin views.
export function BriefContent({ content }: { content: AiBrief }) {
  const totalSeconds = content.shots.reduce((sum, s) => sum + s.seconds, 0);
  return (
    <div className="space-y-6">
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
            <div key={i} className="flex items-start justify-between gap-3 rounded-xl bg-sand-50 p-4">
              <p className="whitespace-pre-line">{c}</p>
              <CopyButton text={`${c}\n\n${content.hashtags.join(" ")}`} />
            </div>
          ))}
          <p className="break-words text-sm text-sea-600">{content.hashtags.join(" ")}</p>
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
  );
}

export function SectionTitle({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-ink-500">
      {icon}
      {children}
    </h2>
  );
}

export function formatDay(iso: string) {
  const date = iso.length === 10 ? new Date(`${iso}T00:00:00+05:30`) : new Date(iso);
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
}

export function formatInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}
