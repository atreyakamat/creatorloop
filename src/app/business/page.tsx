import type { Metadata } from "next";
import { AppShell, Greeting, StepList } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Business" };

export default function BusinessPage() {
  return (
    <AppShell>
      <BusinessHome />
    </AppShell>
  );
}

async function BusinessHome() {
  const user = await requireRole("business");
  const supabase = await createClient();
  const { count } = await supabase
    .from("businesses")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id);
  const hasBusiness = (count ?? 0) > 0;

  return (
    <>
      <Greeting user={user}>
        Tell us about your place, and we&apos;ll turn it into a content plan that local creators can shoot.
      </Greeting>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-500">Getting started</h2>
      <StepList
        steps={[
          { title: "Create your account", body: "You're in.", done: true },
          {
            title: "Add your business",
            body: "Name, area, what you sell and who your customers are.",
            done: hasBusiness,
            soon: !hasBusiness,
          },
          {
            title: "Answer 5 quick questions",
            body: "AI turns your answers into a shot list, hooks and captions.",
            soon: true,
          },
          {
            title: "Approve your first reel",
            body: "Review, comment, approve. Nothing posts without your OK.",
            soon: true,
          },
        ]}
      />
    </>
  );
}
