import "server-only";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/safe";
import { signVideoUrls } from "@/lib/storage";
import type { Brief, Business } from "@/lib/supabase/types";

// Creator data access. RLS limits what comes back: open briefs, briefs assigned
// to this creator, and only their own applications, reels and payouts.

export type BusinessCard = Pick<Business, "id" | "name" | "category" | "area" | "instagram">;

export async function getMyCreator() {
  const user = await requireRole("creator");
  const supabase = await createClient();
  const { data: profile } = await supabase.from("creator_profiles").select("*").eq("id", user.id).maybeSingle();
  return { user, profile };
}

async function businessCards(ids: string[]): Promise<Map<string, BusinessCard>> {
  const map = new Map<string, BusinessCard>();
  if (!ids.length) return map;
  const supabase = await createClient();
  const { data } = await supabase
    .from("businesses")
    .select("id, name, category, area, instagram")
    .in("id", [...new Set(ids)]);
  for (const b of data ?? []) map.set(b.id, b);
  return map;
}

type BriefRow = Pick<Brief, "id" | "title" | "status" | "deliverables" | "due_date" | "created_at" | "business_id" | "budget_inr">;
const BRIEF_COLUMNS = "id, title, status, deliverables, due_date, created_at, business_id, budget_inr";

async function withBusiness(rows: BriefRow[]) {
  const cards = await businessCards(rows.map((r) => r.business_id));
  return rows.map((r) => ({ ...r, business: cards.get(r.business_id) ?? null }));
}

export async function getOpenBriefs(userId: string) {
  const supabase = await createClient();
  const [{ data: briefs }, { data: applications }] = await Promise.all([
    supabase.from("briefs").select(BRIEF_COLUMNS).eq("status", "open").order("created_at", { ascending: false }).limit(50),
    supabase.from("brief_applications").select("brief_id").eq("creator_id", userId),
  ]);
  const applied = new Set((applications ?? []).map((a) => a.brief_id));
  return (await withBusiness(briefs ?? [])).map((b) => ({ ...b, applied: applied.has(b.id) }));
}

export async function getMyAssignedBriefs(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("briefs")
    .select(BRIEF_COLUMNS)
    .eq("assigned_creator_id", userId)
    .order("updated_at", { ascending: false })
    .limit(50);
  return withBusiness(data ?? []);
}

export async function getCreatorBrief(id: string) {
  const { user, profile } = await getMyCreator();
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data: brief } = await supabase.from("briefs").select("*").eq("id", id).maybeSingle();
  if (!brief) return null;

  const mine = brief.assigned_creator_id === user.id;
  if (!mine && brief.status !== "open") return null;

  const [cards, { data: application }, { data: submissions }] = await Promise.all([
    businessCards([brief.business_id]),
    supabase.from("brief_applications").select("id, note, created_at").eq("brief_id", id).eq("creator_id", user.id).maybeSingle(),
    mine
      ? supabase.from("submissions").select("*").eq("brief_id", id).eq("creator_id", user.id).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as never[] }),
  ]);
  const urls = await signVideoUrls((submissions ?? []).map((s) => s.video_path));

  return {
    user,
    profile,
    brief,
    mine,
    business: cards.get(brief.business_id) ?? null,
    application: application ?? null,
    submissions: (submissions ?? []).map((s) => ({ ...s, url: urls.get(s.video_path) ?? null })),
  };
}

export async function getMyPayouts(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payouts")
    .select("*")
    .eq("creator_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  return data ?? [];
}
