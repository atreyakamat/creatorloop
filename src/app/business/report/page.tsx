import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight, Sparkles, Trophy } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { businessNav } from "@/components/nav-links";
import { AiNotice } from "@/components/ai-notice";
import { Card } from "@/components/ui";
import { SectionTitle, formatDay } from "@/components/brief-content";
import { ReelPlayer } from "@/components/reel";
import { SubmitButton } from "@/components/submit-button";
import { currentMonth, monthLabel, parseMonth, reportSchema, shiftMonth } from "@/lib/ai-docs";
import { getMyBusiness } from "@/lib/business";
import { getMonthStats } from "@/lib/report";
import { createMonthlyReport } from "../actions";
import { ResultsForm } from "./results-form";

export const metadata: Metadata = { title: "Monthly report" };

type Props = { searchParams: Promise<{ month?: string; ai?: string }> };

export default function ReportPage({ searchParams }: Props) {
  return (
    <AppShell nav={businessNav}>
      <Report searchParams={searchParams} />
    </AppShell>
  );
}

async function Report({ searchParams }: Props) {
  const [{ business }, params] = await Promise.all([getMyBusiness(), searchParams]);
  if (!business) redirect("/business/onboarding");

  const month = parseMonth(params.month);
  const stats = await getMonthStats(business.id, month);
  const { data } = stats;
  const parsed = reportSchema.safeParse(stats.summary?.content);
  const summary = parsed.success ? parsed.data : null;
  const next = shiftMonth(month, 1);
  const number = (n: number | null) => (n === null ? "—" : n.toLocaleString("en-IN"));

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl leading-tight sm:text-5xl">{monthLabel(month)}</h1>
        <div className="flex items-center gap-1">
          <Link
            href={`/business/report?month=${shiftMonth(month, -1)}`}
            aria-label="Previous month"
            className="rounded-full border border-ink-950/10 bg-white p-2 hover:bg-sand-100"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </Link>
          {next <= currentMonth() ? (
            <Link
              href={`/business/report?month=${next}`}
              aria-label="Next month"
              className="rounded-full border border-ink-950/10 bg-white p-2 hover:bg-sand-100"
            >
              <ChevronRight className="size-5" aria-hidden />
            </Link>
          ) : null}
        </div>
      </div>
      <AiNotice code={params.ai} />

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Reels delivered", value: number(data.delivered) },
          { label: "Approved", value: number(data.approved) },
          { label: "Views logged", value: number(data.totalViews) },
          { label: "Likes logged", value: number(data.totalLikes) },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-sm text-ink-500">{s.label}</p>
            <p className="mt-2 font-display text-4xl tabular-nums">{s.value}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <SectionTitle icon={<Sparkles className="size-4" />}>What worked</SectionTitle>
        {summary ? (
          <div className="space-y-5">
            <p className="text-lg leading-relaxed text-ink-900">{summary.headline}</p>
            <ReportList title="Worked well" items={summary.what_worked} />
            <ReportList title="Do differently" items={summary.to_improve} />
            <ReportList title="Next month" items={summary.next_steps} />
            {stats.summary ? <p className="text-sm text-ink-500">Written {formatDay(stats.summary.updated_at)} from the numbers above.</p> : null}
          </div>
        ) : (
          <p className="text-ink-500">
            {data.delivered
              ? "Log views and likes for your posted reels below, then get a plain-language summary of the month."
              : "No reels were delivered this month."}
          </p>
        )}
        {data.delivered ? (
          <form action={createMonthlyReport.bind(null, month)} className="mt-5">
            <SubmitButton variant={summary ? "outline" : "accent"} pendingText="Writing… (about 15 seconds)">
              <Sparkles className="size-4" aria-hidden /> {summary ? "Rewrite summary" : "Write my summary"}
            </SubmitButton>
          </form>
        ) : null}
      </Card>

      {stats.approvedReels.length ? (
        <Card className="mt-6">
          <SectionTitle>Approved reels</SectionTitle>
          <p className="-mt-2 mb-4 text-sm text-ink-500">
            After you post a reel, add its views and likes from Instagram. {stats.loggedCount} of {stats.approvedReels.length} logged.
          </p>
          <ul className="space-y-5">
            {stats.approvedReels.map((r) => (
              <li key={r.id} className="flex flex-col gap-4 border-t border-ink-950/8 pt-5 first:border-0 first:pt-0 sm:flex-row">
                <ReelPlayer url={r.url} />
                <div className="min-w-0 flex-1">
                  <Link href={`/business/briefs/${r.briefId}`} className="font-medium underline-offset-4 hover:underline">
                    {r.brief}
                  </Link>
                  {stats.topReelId === r.id ? (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-palm-500/15 px-2.5 py-1 text-xs font-medium text-palm-500">
                      <Trophy className="size-3.5" aria-hidden /> Most viewed
                    </span>
                  ) : null}
                  <ResultsForm id={r.id} views={r.views} likes={r.likes} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}

function ReportList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="text-sm font-semibold text-ink-700">{title}</p>
      <ul className="mt-1.5 list-disc space-y-1 pl-5 text-ink-700">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
