import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { adminNav } from "@/components/nav-links";
import { Card } from "@/components/ui";
import { formatInr } from "@/components/brief-content";
import { SubmitButton } from "@/components/submit-button";
import { listCreators } from "@/lib/admin";
import { safeHttpUrl } from "@/lib/safe";
import { setCreatorVerified } from "../actions";

export const metadata: Metadata = { title: "Creators · Admin" };

export default function AdminCreatorsPage() {
  return (
    <AppShell nav={adminNav}>
      <Creators />
    </AppShell>
  );
}

async function Creators() {
  const creators = await listCreators();
  return (
    <>
      <h1 className="font-display text-4xl leading-tight sm:text-5xl">Creators</h1>
      <p className="mt-2 text-ink-500">Verify creators whose work you&apos;ve checked. Verified shows on their profile and to businesses.</p>
      {creators.length ? (
        <ul className="mt-6 space-y-3">
          {creators.map((c) => {
            const links = c.portfolio_urls.map((u) => safeHttpUrl(u)).filter((u): u is string => u !== null);
            return (
              <li key={c.id} className="rounded-2xl border border-ink-950/8 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {c.display_name || c.person?.full_name || "Unnamed"}
                      {c.is_verified ? <span className="ml-2 text-sm font-normal text-palm-500">Verified</span> : null}
                      {!c.ready ? <span className="ml-2 text-sm font-normal text-ink-500">Profile incomplete</span> : null}
                    </p>
                    <p className="mt-1 text-sm text-ink-500">
                      {c.instagram ? `@${c.instagram} · ` : ""}
                      {c.niches.join(", ") || "No niches yet"}
                      {c.followers ? ` · ${c.followers.toLocaleString("en-IN")} followers` : ""}
                      {c.rate_per_reel ? ` · ${formatInr(c.rate_per_reel)}/reel` : ""}
                    </p>
                    {c.person?.phone ? <p className="mt-1 text-sm text-ink-700">WhatsApp: {c.person.phone}</p> : null}
                    {c.bio ? <p className="mt-2 text-sm text-ink-700">{c.bio}</p> : null}
                    {links.length ? (
                      <p className="mt-2 flex flex-wrap gap-3 text-sm">
                        {links.map((u, i) => (
                          <a key={u} href={u} target="_blank" rel="noopener noreferrer nofollow" className="text-sea-600 underline underline-offset-4">
                            Work sample {i + 1}
                          </a>
                        ))}
                      </p>
                    ) : null}
                  </div>
                  <form action={setCreatorVerified.bind(null, c.id, !c.is_verified)}>
                    <SubmitButton variant={c.is_verified ? "outline" : "primary"} pendingText="Saving…" className="px-4 py-2">
                      {c.is_verified ? "Remove verified" : "Verify"}
                    </SubmitButton>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <Card className="mt-6 text-ink-500">No creators have signed up yet.</Card>
      )}
    </>
  );
}
