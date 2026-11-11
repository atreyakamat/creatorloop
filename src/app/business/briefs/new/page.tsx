import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { businessNav } from "@/components/nav-links";
import { AppShell } from "@/components/app-shell";
import { BackLink } from "@/components/ui";
import { getMyBusiness } from "@/lib/business";
import { BriefForm } from "./brief-form";

export const metadata: Metadata = { title: "New brief" };

export default function NewBriefPage() {
  return (
    <AppShell nav={businessNav}>
      <NewBrief />
    </AppShell>
  );
}

async function NewBrief() {
  const { business } = await getMyBusiness();
  if (!business) redirect("/business/onboarding");

  return (
    <div className="max-w-xl">
      <BackLink href="/business">Back</BackLink>
      <h1 className="font-display text-4xl leading-tight sm:text-5xl">Five quick questions</h1>
      <p className="mt-2 text-ink-500">
        Answer in your own words. We&apos;ll turn it into hooks, a shot list and captions for {business.name}.
      </p>
      <div className="mt-8">
        <BriefForm />
      </div>
    </div>
  );
}
