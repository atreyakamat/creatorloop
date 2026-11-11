import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { BackLink } from "@/components/ui";
import { getMyBusiness } from "@/lib/business";
import { BusinessForm } from "./business-form";

export const metadata: Metadata = { title: "Your business" };

export default function OnboardingPage() {
  return (
    <AppShell>
      <Onboarding />
    </AppShell>
  );
}

async function Onboarding() {
  const { business } = await getMyBusiness();
  return (
    <div className="max-w-xl">
      <BackLink href="/business">Back</BackLink>
      <h1 className="font-display text-4xl leading-tight sm:text-5xl">
        {business ? "Edit your business" : "Tell us about your place"}
      </h1>
      <p className="mt-2 text-ink-500">
        The more you share, the better your briefs. Takes about two minutes.
      </p>
      <div className="mt-8">
        <BusinessForm business={business} />
      </div>
    </div>
  );
}
