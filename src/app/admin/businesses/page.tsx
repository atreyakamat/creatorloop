import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { adminNav } from "@/components/nav-links";
import { Card } from "@/components/ui";
import { formatDay } from "@/components/brief-content";
import Link from "next/link";
import { planName } from "@/config/site";
import { listBusinesses } from "@/lib/admin";

export const metadata: Metadata = { title: "Businesses · Admin" };

export default function AdminBusinessesPage() {
  return (
    <AppShell nav={adminNav}>
      <Businesses />
    </AppShell>
  );
}

async function Businesses() {
  const businesses = await listBusinesses();
  return (
    <>
      <h1 className="font-display text-4xl leading-tight sm:text-5xl">Businesses</h1>
      {businesses.length ? (
        <ul className="mt-6 space-y-3">
          {businesses.map((b) => (
            <li key={b.id} className="rounded-2xl border border-ink-950/8 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Link href={`/admin/businesses/${b.id}`} className="font-medium underline-offset-4 hover:underline">
                  {b.name}
                </Link>
                <span
                  className={
                    b.plan === "none"
                      ? "rounded-full bg-sand-100 px-2.5 py-1 text-xs font-medium text-ink-700"
                      : "rounded-full bg-palm-500/15 px-2.5 py-1 text-xs font-medium text-palm-500"
                  }
                >
                  {b.plan === "none" ? "No plan" : `${planName(b.plan)} · ${b.reels_per_month}/month`}
                </span>
              </div>
              <p className="mt-1 text-sm text-ink-500">
                {b.category}
                {b.area ? ` · ${b.area}` : ""}
                {b.instagram ? ` · @${b.instagram}` : ""} · joined {formatDay(b.created_at)}
              </p>
              <p className="mt-1 text-sm text-ink-700">
                Owner: {b.owner?.full_name || "—"}
                {b.owner?.phone ? ` · ${b.owner.phone}` : ""}
              </p>
              {b.about ? <p className="mt-2 text-sm text-ink-700">{b.about}</p> : null}
            </li>
          ))}
        </ul>
      ) : (
        <Card className="mt-6 text-ink-500">No businesses have signed up yet.</Card>
      )}
    </>
  );
}
