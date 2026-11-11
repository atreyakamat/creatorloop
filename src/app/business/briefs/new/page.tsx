import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { businessNav } from "@/components/nav-links";
import { AppShell } from "@/components/app-shell";
import { BackLink } from "@/components/ui";
import { getMyBusiness } from "@/lib/business";
import { BriefForm } from "./brief-form";

export const metadata: Metadata = { title: "New brief" };

type Props = { searchParams: Promise<{ feature?: string }> };

export default function NewBriefPage({ searchParams }: Props) {
  return (
    <AppShell nav={businessNav}>
      <NewBrief searchParams={searchParams} />
    </AppShell>
  );
}

async function NewBrief({ searchParams }: Props) {
  const [{ business }, { feature }] = await Promise.all([getMyBusiness(), searchParams]);
  if (!business) redirect("/business/onboarding");

  return (
    <div className="max-w-xl">
      <BackLink href="/business">Back</BackLink>
      <h1 className="font-display text-4xl leading-tight sm:text-5xl">Five quick questions</h1>
      <p className="mt-2 text-ink-500">
        Answer in your own words. We&apos;ll turn it into hooks, a shot list and captions for {business.name}.
      </p>
      <div className="mt-8">
        <BriefForm defaultFeature={typeof feature === "string" ? feature.slice(0, 300) : undefined} />
      </div>
    </div>
  );
}
