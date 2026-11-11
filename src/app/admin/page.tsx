import type { Metadata } from "next";
import { AppShell, Greeting } from "@/components/app-shell";
import { Card } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin" };

export default function AdminPage() {
  return (
    <AppShell>
      <AdminHome />
    </AppShell>
  );
}

async function AdminHome() {
  const user = await requireRole("admin");
  const supabase = await createClient();

  const count = async (table: "businesses" | "creator_profiles" | "briefs") => {
    const { count } = await supabase.from(table).select("id", { count: "exact", head: true });
    return count ?? 0;
  };
  const [businesses, creators, briefs] = await Promise.all([
    count("businesses"),
    count("creator_profiles"),
    count("briefs"),
  ]);

  const stats = [
    { label: "Businesses", value: businesses },
    { label: "Creators", value: creators },
    { label: "Briefs", value: briefs },
  ];

  return (
    <>
      <Greeting user={user}>Everything running through the loop.</Greeting>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <p className="text-sm text-ink-500">{s.label}</p>
            <p className="mt-2 font-display text-5xl tabular-nums">{s.value}</p>
          </Card>
        ))}
      </div>
    </>
  );
}
