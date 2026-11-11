import type { Metadata } from "next";
import { AppShell, Greeting, StepList } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Creator" };

export default function CreatorPage() {
  return (
    <AppShell>
      <CreatorHome />
    </AppShell>
  );
}

async function CreatorHome() {
  const user = await requireRole("creator");
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("creator_profiles")
    .select("bio, niches, instagram")
    .eq("id", user.id)
    .maybeSingle();
  const profileDone = Boolean(profile?.bio && profile.instagram && profile.niches.length);

  return (
    <>
      <Greeting user={user}>
        Get paid to make content for Goa&apos;s cafés, hotels and shops. Follower count isn&apos;t everything:
        good work is.
      </Greeting>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-500">Getting started</h2>
      <StepList
        steps={[
          { title: "Create your account", body: "You're in.", done: true },
          {
            title: "Build your profile",
            body: "Your niches, Instagram and 3 best pieces of work.",
            done: profileDone,
            soon: !profileDone,
          },
          { title: "Pick up a paid brief", body: "See open briefs near you and apply.", soon: true },
          { title: "Upload, get approved, get paid", body: "Track every payout in one place.", soon: true },
        ]}
      />
    </>
  );
}
