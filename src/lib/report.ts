import "server-only";
import { monthLabel, monthRange } from "@/lib/ai-docs";
import { createClient } from "@/lib/supabase/server";
import { signVideoUrls } from "@/lib/storage";
import type { ReportData } from "@/lib/ai/plan";

// All figures on the report are computed here from the database. The AI only
// writes commentary on top of these numbers.
export async function getMonthStats(businessId: string, month: string) {
  const supabase = await createClient();
  const { start, end, period } = monthRange(month);

  const { data: briefs } = await supabase.from("briefs").select("id, title").eq("business_id", businessId);
  const briefIds = (briefs ?? []).map((b) => b.id);
  const titles = new Map((briefs ?? []).map((b) => [b.id, b.title]));

  const [{ data: submissions }, { data: doc }] = await Promise.all([
    briefIds.length
      ? supabase
          .from("submissions")
          .select("id, brief_id, status, views, likes, created_at, video_path")
          .in("brief_id", briefIds)
          .gte("created_at", start.toISOString())
          .lt("created_at", end.toISOString())
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as never[] }),
    supabase.from("ai_documents").select("content, updated_at").eq("business_id", businessId).eq("kind", "report").eq("period", period).maybeSingle(),
  ]);

  const rows = submissions ?? [];
  const approved = rows.filter((r) => r.status === "approved");
  const logged = approved.filter((r) => r.views !== null || r.likes !== null);
  const sum = (key: "views" | "likes") =>
    logged.some((r) => r[key] !== null) ? logged.reduce((s, r) => s + (r[key] ?? 0), 0) : null;
  const top = [...approved].filter((r) => r.views !== null).sort((a, b) => (b.views ?? 0) - (a.views ?? 0))[0] ?? null;
  const urls = await signVideoUrls(approved.map((r) => r.video_path));

  const data: ReportData = {
    month: monthLabel(month),
    delivered: rows.length,
    approved: approved.length,
    changesRequested: rows.filter((r) => r.status === "changes_requested").length,
    totalViews: sum("views"),
    totalLikes: sum("likes"),
    reels: rows.map((r) => ({ brief: titles.get(r.brief_id) ?? "Brief", status: r.status, views: r.views, likes: r.likes })),
  };

  return {
    period,
    data,
    approvedReels: approved.map((r) => ({
      id: r.id,
      brief: titles.get(r.brief_id) ?? "Brief",
      briefId: r.brief_id,
      views: r.views,
      likes: r.likes,
      url: urls.get(r.video_path) ?? null,
    })),
    topReelId: top?.id ?? null,
    loggedCount: logged.length,
    summary: doc ?? null,
  };
}
