import "server-only";
import { createClient } from "@/lib/supabase/server";

export type AiKind = "brief" | "match" | "calendar" | "report";

// Per-account daily caps across all AI features. Rows can only be added by the
// account itself and never removed (see ai_usage policies), so this can't be reset.
const DAILY_LIMIT: Record<AiKind, number> = { brief: 30, match: 40, calendar: 5, report: 5 };

// Returns true and records one use if the account is under today's cap.
export async function reserveAiUse(kind: AiKind): Promise<boolean> {
  const supabase = await createClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("kind", kind)
    .gte("created_at", since);
  if (error || (count ?? 0) >= DAILY_LIMIT[kind]) return false;

  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return false;
  const { error: insertError } = await supabase.from("ai_usage").insert({ user_id: userId, kind });
  return !insertError;
}
