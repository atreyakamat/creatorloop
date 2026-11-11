import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarDays, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { businessNav } from "@/components/nav-links";
import { AiNotice } from "@/components/ai-notice";
import { ButtonLink, Card } from "@/components/ui";
import { formatDay } from "@/components/brief-content";
import { SubmitButton } from "@/components/submit-button";
import { calendarSchema, currentMonth, monthRange } from "@/lib/ai-docs";
import { getMyBusiness } from "@/lib/business";
import { createClient } from "@/lib/supabase/server";
import { createContentPlan } from "../actions";

export const metadata: Metadata = { title: "Content plan" };

type Props = { searchParams: Promise<{ ai?: string }> };

export default function PlanPage({ searchParams }: Props) {
  return (
    <AppShell nav={businessNav}>
      <Plan searchParams={searchParams} />
    </AppShell>
  );
}

async function Plan({ searchParams }: Props) {
  const [{ business }, { ai }] = await Promise.all([getMyBusiness(), searchParams]);
  if (!business) redirect("/business/onboarding");

  const supabase = await createClient();
  const { data: doc } = await supabase
    .from("ai_documents")
    .select("content, updated_at")
    .eq("business_id", business.id)
    .eq("kind", "calendar")
    .eq("period", monthRange(currentMonth()).period)
    .maybeSingle();
  const parsed = calendarSchema.safeParse(doc?.content);
  const plan = parsed.success ? parsed.data : null;

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-4xl leading-tight sm:text-5xl">Content plan</h1>
      <p className="mt-2 text-ink-500">
        Four weeks of reel ideas for {business.name}, timed to what&apos;s happening in Goa. Turn any idea into a brief.
      </p>
      <AiNotice code={ai} />

      {plan ? (
        <>
          <Card className="mt-8">
            <p className="text-lg leading-relaxed text-ink-900">{plan.summary}</p>
            {doc ? <p className="mt-3 text-sm text-ink-500">Written {formatDay(doc.updated_at)}</p> : null}
          </Card>
          <ol className="mt-6 space-y-6">
            {plan.weeks.map((week, i) => (
              <li key={i}>
                <h2 className="flex flex-wrap items-baseline gap-x-3 text-sm font-semibold uppercase tracking-wider text-ink-500">
                  <CalendarDays className="size-4 self-center" aria-hidden />
                  {week.label}
                  <span className="font-normal normal-case tracking-normal text-ink-700">{week.theme}</span>
                </h2>
                <ul className="mt-3 space-y-3">
                  {week.ideas.map((idea, j) => (
                    <li key={j} className="rounded-2xl border border-ink-950/8 bg-white p-5">
                      <p className="font-medium">{idea.title}</p>
                      <p className="mt-1 text-ink-700">“{idea.hook}”</p>
                      <p className="mt-2 text-sm text-ink-500">{idea.why_now}</p>
                      <ButtonLink
                        href={`/business/briefs/new?feature=${encodeURIComponent(idea.title.slice(0, 280))}`}
                        variant="outline"
                        className="mt-4 px-4 py-2"
                      >
                        Start a brief <ArrowRight className="size-4" aria-hidden />
                      </ButtonLink>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
          <form action={createContentPlan} className="mt-8">
            <SubmitButton variant="outline" pendingText="Writing… (about 20 seconds)">
              <Sparkles className="size-4" aria-hidden /> Write a fresh plan
            </SubmitButton>
          </form>
        </>
      ) : (
        <Card className="mt-8 text-center">
          <CalendarDays className="mx-auto size-7 text-sunset-500" aria-hidden />
          <p className="mt-3 font-display text-3xl">Plan your next four weeks</p>
          <p className="mx-auto mt-2 max-w-sm text-ink-500">
            AI looks at your business and the season and suggests two reel ideas a week.
          </p>
          <form action={createContentPlan} className="mt-6">
            <SubmitButton variant="accent" pendingText="Writing… (about 20 seconds)">
              <Sparkles className="size-4" aria-hidden /> Write my plan
            </SubmitButton>
          </form>
        </Card>
      )}
    </div>
  );
}
