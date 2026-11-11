import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { adminNav } from "@/components/nav-links";
import { Card } from "@/components/ui";
import { formatDay } from "@/components/brief-content";
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
              <p className="font-medium">{b.name}</p>
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
