import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin, Pencil, Plus, Sparkles } from "lucide-react";
import { businessNav } from "@/components/nav-links";
import { AppShell, Greeting, StepList } from "@/components/app-shell";
import { ButtonLink, Card } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { getMyBriefs, getMyBusiness } from "@/lib/business";

export const metadata: Metadata = { title: "Business" };

export default function BusinessPage() {
  return (
    <AppShell nav={businessNav}>
      <BusinessHome />
    </AppShell>
  );
}

async function BusinessHome() {
  const { user, business } = await getMyBusiness();

  if (!business) {
    return (
      <>
        <Greeting user={user}>
          Tell us about your place, and we&apos;ll turn it into a content plan that local creators can shoot.
        </Greeting>
        <StepList
          steps={[
            { title: "Create your account", body: "You're in.", done: true },
            { title: "Add your business", body: "Name, area, what you sell and who your customers are." },
            { title: "Answer 5 quick questions", body: "AI turns your answers into a shot list, hooks and captions." },
            { title: "Approve your reels", body: "Review, comment, approve. Nothing posts without your OK." },
          ]}
        />
        <ButtonLink href="/business/onboarding" variant="accent" className="mt-6">
          Add your business <ArrowRight className="size-4" aria-hidden />
        </ButtonLink>
      </>
    );
  }

  const briefs = await getMyBriefs(business.id);

  return (
    <>
      <Greeting user={user} />

      <Card className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-display text-3xl leading-tight">{business.name}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-500">
            <span>{business.category}</span>
            {business.area ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" aria-hidden /> {business.area}
              </span>
            ) : null}
            {business.instagram ? <span>@{business.instagram}</span> : null}
          </p>
        </div>
        <ButtonLink href="/business/onboarding" variant="outline" className="px-4 py-2">
          <Pencil className="size-4" aria-hidden /> Edit
        </ButtonLink>
      </Card>

      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-500">Your briefs</h2>
        {briefs.length ? (
          <ButtonLink href="/business/briefs/new" className="px-4 py-2">
            <Plus className="size-4" aria-hidden /> New brief
          </ButtonLink>
        ) : null}
      </div>

      {briefs.length ? (
        <ul className="space-y-3">
          {briefs.map((b) => (
            <li key={b.id}>
              <Link
                href={`/business/briefs/${b.id}`}
                className="flex items-center justify-between gap-4 rounded-2xl border border-ink-950/8 bg-white p-5 transition-colors hover:border-ink-950/20"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{b.title}</p>
                  <p className="mt-1 text-sm text-ink-500">
                    {b.deliverables} reel{b.deliverables === 1 ? "" : "s"} · {formatDate(b.created_at)}
                    {b.ai_brief ? "" : " · not written yet"}
                  </p>
                </div>
                <StatusBadge status={b.status} />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Card className="text-center">
          <Sparkles className="mx-auto size-7 text-sunset-500" aria-hidden />
          <p className="mt-3 font-display text-3xl">Your first brief</p>
          <p className="mx-auto mt-2 max-w-sm text-ink-500">
            Answer five quick questions. AI writes the hooks, shot list and captions in about 15 seconds.
          </p>
          <ButtonLink href="/business/briefs/new" variant="accent" className="mt-6">
            Start a brief <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
        </Card>
      )}
    </>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
}
