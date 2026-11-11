import "server-only";
import { monthRange, currentMonth } from "@/lib/ai-docs";
import { createClient } from "@/lib/supabase/server";
import type { Business } from "@/lib/supabase/types";

// Reels already committed this month (briefs sent to creators and not cancelled).
// Mirrors the rule the database enforces in guard_brief_update.
export async function getUsage(business: Pick<Business, "id" | "plan" | "reels_per_month">) {
  const supabase = await createClient();
  const { start } = monthRange(currentMonth());
  const { data } = await supabase
    .from("briefs")
    .select("deliverables")
    .eq("business_id", business.id)
    .not("status", "in", "(draft,cancelled)")
    .gte("opened_at", start.toISOString());
  const used = (data ?? []).reduce((sum, b) => sum + b.deliverables, 0);
  return {
    used,
    allowance: business.reels_per_month,
    left: Math.max(0, business.reels_per_month - used),
    active: business.plan !== "none",
  };
}

export async function getInvoices(businessId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("*")
    .eq("business_id", businessId)
    .neq("status", "void")
    .order("period", { ascending: false })
    .limit(24);
  return data ?? [];
}
