import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { creatorNav } from "@/components/nav-links";
import { Card } from "@/components/ui";
import { getMyCreator } from "@/lib/creator";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Your profile" };

export default function CreatorProfilePage({ searchParams }: { searchParams: Promise<{ finish?: string }> }) {
  return (
    <AppShell nav={creatorNav}>
      <Profile searchParams={searchParams} />
    </AppShell>
  );
}

async function Profile({ searchParams }: { searchParams: Promise<{ finish?: string }> }) {
  const [{ profile }, { finish }] = await Promise.all([getMyCreator(), searchParams]);
  if (!profile) {
    return <Card className="text-ink-500">This account doesn&apos;t have a creator profile.</Card>;
  }
  return (
    <div className="max-w-xl">
      <h1 className="font-display text-4xl leading-tight sm:text-5xl">Your profile</h1>
      <p className="mt-2 text-ink-500">This is what we use to match you with businesses.</p>
      {finish ? (
        <p role="status" className="mt-6 rounded-xl bg-sunset-500/10 px-4 py-3 text-sm text-sunset-600">
          Complete your profile first, then you can apply.
        </p>
      ) : null}
      {profile.is_verified ? (
        <p className="mt-6 inline-flex rounded-full bg-palm-500/15 px-3 py-1 text-xs font-medium text-palm-500">
          Verified creator
        </p>
      ) : null}
      <div className="mt-8">
        <ProfileForm profile={profile} />
      </div>
    </div>
  );
}
