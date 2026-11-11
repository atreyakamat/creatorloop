import "server-only";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Business data access. RLS already scopes every query to the owner;
// these helpers also filter explicitly so an admin sees only their own here.

export async function getMyBusiness() {
  const user = await requireRole("business");
  const supabase = await createClient();
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return { user, business: data };
}

export async function getMyBriefs(businessId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("briefs")
    .select("id, title, status, deliverables, created_at, ai_brief")
    .eq("business_id", businessId)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getMyBrief(id: string) {
  const { business } = await getMyBusiness();
  if (!business || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("briefs")
    .select("*")
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();
  return data ? { brief: data, business } : null;
}
