import type { Metadata } from "next";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { creatorNav } from "@/components/nav-links";
import { Card } from "@/components/ui";
import { formatDay } from "@/components/brief-content";
import { getMyCreator, getOpenBriefs } from "@/lib/creator";

export const metadata: Metadata = { title: "Open briefs" };

export default function OpenBriefsPage() {
  return (
    <AppShell nav={creatorNav}>
      <OpenBriefs />
    </AppShell>
  );
}

async function OpenBriefs() {
  const { user } = await getMyCreator();
  const briefs = await getOpenBriefs(user.id);

  return (
    <>
      <h1 className="font-display text-4xl leading-tight sm:text-5xl">Open briefs</h1>
      <p className="mt-2 text-ink-500">Businesses looking for a creator right now. Apply to the ones that fit you.</p>
      {briefs.length ? (
        <ul className="mt-8 space-y-3">
          {briefs.map((b) => (
            <li key={b.id}>
              <Link
                href={`/creator/briefs/${b.id}`}
                className="flex items-center justify-between gap-4 rounded-2xl border border-ink-950/8 bg-white p-5 hover:border-ink-950/20"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{b.title}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-500">
                    <span>{b.business?.name ?? "Business"}</span>
                    {b.business?.area ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5" aria-hidden /> {b.business.area}
                      </span>
                    ) : null}
                    <span>
                      {b.deliverables} reel{b.deliverables === 1 ? "" : "s"}
                    </span>
                    {b.due_date ? <span>due {formatDay(b.due_date)}</span> : null}
                  </p>
                </div>
                {b.applied ? (
                  <span className="shrink-0 rounded-full bg-sea-500/10 px-2.5 py-1 text-xs font-medium text-sea-600">Applied</span>
                ) : (
                  <span className="shrink-0 text-sm font-medium text-sunset-600">View</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Card className="mt-8 text-ink-500">No open briefs right now. New ones show up here as businesses post them.</Card>
      )}
    </>
  );
}
