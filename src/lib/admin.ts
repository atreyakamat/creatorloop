import "server-only";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/safe";
import { signVideoUrls } from "@/lib/storage";
import type { BriefStatus, CreatorProfile } from "@/lib/supabase/types";

// Admin data access. Every function starts with requireRole("admin"); RLS's
// is_admin() is what actually opens the rows, so a non-admin gets nothing back.

export const BRIEF_STATUSES: BriefStatus[] = ["open", "assigned", "in_review", "approved", "completed", "draft", "cancelled"];

export async function getOverview() {
  const user = await requireRole("admin");
  const supabase = await createClient();
  const countBriefs = async (status: BriefStatus) => {
    const { count } = await supabase.from("briefs").select("id", { count: "exact", head: true }).eq("status", status);
    return count ?? 0;
  };
  const countAll = async (table: "businesses" | "creator_profiles") => {
    const { count } = await supabase.from(table).select("id", { count: "exact", head: true });
    return count ?? 0;
  };
  const [open, assigned, inReview, approved, completed, businesses, creators, { data: pending }] = await Promise.all([
    countBriefs("open"),
    countBriefs("assigned"),
    countBriefs("in_review"),
    countBriefs("approved"),
    countBriefs("completed"),
    countAll("businesses"),
    countAll("creator_profiles"),
    supabase.from("payouts").select("amount_inr").eq("status", "pending"),
  ]);
  const pendingPayouts = (pending ?? []).reduce((s, p) => s + p.amount_inr, 0);
  return { user, open, assigned, inReview, approved, completed, businesses, creators, pendingPayouts };
}

async function nameMaps(businessIds: string[], creatorIds: string[]) {
  const supabase = await createClient();
  const [{ data: businesses }, { data: creators }] = await Promise.all([
    businessIds.length
      ? supabase.from("businesses").select("id, name, area").in("id", [...new Set(businessIds)])
      : Promise.resolve({ data: [] as { id: string; name: string; area: string | null }[] }),
    creatorIds.length
      ? supabase.from("creator_profiles").select("id, display_name").in("id", [...new Set(creatorIds)])
      : Promise.resolve({ data: [] as { id: string; display_name: string }[] }),
  ]);
  return {
    business: new Map((businesses ?? []).map((b) => [b.id, b])),
    creator: new Map((creators ?? []).map((c) => [c.id, c])),
  };
}

export async function listBriefs(status?: string) {
  await requireRole("admin");
  const supabase = await createClient();
  let query = supabase
    .from("briefs")
    .select("id, title, status, deliverables, due_date, created_at, business_id, assigned_creator_id, budget_inr")
    .order("updated_at", { ascending: false })
    .limit(200);
  if (status && (BRIEF_STATUSES as string[]).includes(status)) query = query.eq("status", status as BriefStatus);
  const { data } = await query;
  const rows = data ?? [];
  const names = await nameMaps(
    rows.map((r) => r.business_id),
    rows.flatMap((r) => (r.assigned_creator_id ? [r.assigned_creator_id] : [])),
  );
  return rows.map((r) => ({
    ...r,
    business: names.business.get(r.business_id) ?? null,
    creator: r.assigned_creator_id ? (names.creator.get(r.assigned_creator_id) ?? null) : null,
  }));
}

export function creatorReady(c: Pick<CreatorProfile, "display_name" | "bio" | "instagram" | "niches">) {
  return Boolean(c.display_name && c.bio && c.instagram && c.niches.length);
}

export async function getAdminBrief(id: string) {
  await requireRole("admin");
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data: brief } = await supabase.from("briefs").select("*").eq("id", id).maybeSingle();
  if (!brief) return null;

  const [{ data: business }, { data: applications }, { data: creators }, { data: submissions }, { data: payout }] =
    await Promise.all([
      supabase.from("businesses").select("*").eq("id", brief.business_id).maybeSingle(),
      supabase.from("brief_applications").select("*").eq("brief_id", id).order("created_at"),
      supabase.from("creator_profiles").select("*").order("is_verified", { ascending: false }).limit(300),
      supabase.from("submissions").select("*").eq("brief_id", id).order("created_at", { ascending: false }),
      supabase.from("payouts").select("*").eq("brief_id", id).maybeSingle(),
    ]);
  const { data: owner } = business
    ? await supabase.from("profiles").select("full_name, phone").eq("id", business.owner_id).maybeSingle()
    : { data: null };
  const urls = await signVideoUrls((submissions ?? []).map((s) => s.video_path));
  const applied = new Map((applications ?? []).map((a) => [a.creator_id, a]));

  return {
    brief,
    business: business ?? null,
    owner: owner ?? null,
    payout: payout ?? null,
    candidates: (creators ?? [])
      .filter(creatorReady)
      .map((c) => ({ ...c, application: applied.get(c.id) ?? null }))
      .sort((a, b) => Number(Boolean(b.application)) - Number(Boolean(a.application))),
    assigned: (creators ?? []).find((c) => c.id === brief.assigned_creator_id) ?? null,
    submissions: (submissions ?? []).map((s) => ({ ...s, url: urls.get(s.video_path) ?? null })),
  };
}

export async function listCreators() {
  await requireRole("admin");
  const supabase = await createClient();
  const { data: creators } = await supabase.from("creator_profiles").select("*").order("created_at", { ascending: false }).limit(300);
  const ids = (creators ?? []).map((c) => c.id);
  const { data: people } = ids.length
    ? await supabase.from("profiles").select("id, full_name, phone").in("id", ids)
    : { data: [] as { id: string; full_name: string; phone: string | null }[] };
  const byId = new Map((people ?? []).map((p) => [p.id, p]));
  return (creators ?? []).map((c) => ({ ...c, person: byId.get(c.id) ?? null, ready: creatorReady(c) }));
}

export async function listBusinesses() {
  await requireRole("admin");
  const supabase = await createClient();
  const { data: businesses } = await supabase.from("businesses").select("*").order("created_at", { ascending: false }).limit(300);
  const owners = (businesses ?? []).map((b) => b.owner_id);
  const { data: people } = owners.length
    ? await supabase.from("profiles").select("id, full_name, phone").in("id", owners)
    : { data: [] as { id: string; full_name: string; phone: string | null }[] };
  const byId = new Map((people ?? []).map((p) => [p.id, p]));
  return (businesses ?? []).map((b) => ({ ...b, owner: byId.get(b.owner_id) ?? null }));
}

export async function listPayouts() {
  await requireRole("admin");
  const supabase = await createClient();
  const { data } = await supabase.from("payouts").select("*").order("created_at", { ascending: false }).limit(300);
  const rows = data ?? [];
  const briefIds = rows.flatMap((r) => (r.brief_id ? [r.brief_id] : []));
  const [{ data: briefs }, names] = await Promise.all([
    briefIds.length
      ? supabase.from("briefs").select("id, title").in("id", briefIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    nameMaps([], rows.map((r) => r.creator_id)),
  ]);
  const briefById = new Map((briefs ?? []).map((b) => [b.id, b]));
  return rows.map((r) => ({
    ...r,
    creator: names.creator.get(r.creator_id) ?? null,
    brief: r.brief_id ? (briefById.get(r.brief_id) ?? null) : null,
  }));
}

export async function getAdminBusiness(id: string) {
  await requireRole("admin");
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data: business } = await supabase.from("businesses").select("*").eq("id", id).maybeSingle();
  if (!business) return null;
  const [{ data: owner }, { data: invoices }, { data: briefs }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone").eq("id", business.owner_id).maybeSingle(),
    supabase.from("invoices").select("*").eq("business_id", id).order("period", { ascending: false }).limit(36),
    supabase
      .from("briefs")
      .select("id, title, status, deliverables, created_at")
      .eq("business_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  return { business, owner: owner ?? null, invoices: invoices ?? [], briefs: briefs ?? [] };
}
