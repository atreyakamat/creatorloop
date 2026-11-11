"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { z } from "zod";
import { getMyBusiness } from "@/lib/business";
import { createClient } from "@/lib/supabase/server";
import { AiNotConfiguredError, aiConfigured, generateAiBrief } from "@/lib/ai/brief";
import { reserveAiUse } from "@/lib/ai/usage";
import { generateCalendar, generateReport } from "@/lib/ai/plan";
import { currentMonth, monthRange, parseMonth } from "@/lib/ai-docs";
import { getMonthStats } from "@/lib/report";
import { cleanInstagram, isUuid } from "@/lib/safe";
import {
  CATEGORIES,
  MAX_AI_GENERATIONS,
  MAX_BRIEFS_PER_DAY,
  briefAnswersSchema,
  type BriefAnswers,
} from "@/lib/briefs";
import type { Brief, Business, Json } from "@/lib/supabase/types";

export type FormState = { error?: string } | undefined;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));

const businessSchema = z.object({
  name: z.string().trim().min(2, "Enter your business name").max(80),
  category: z.enum(CATEGORIES, { error: "Pick a category" }),
  area: optionalText(60),
  instagram: optionalText(120).transform((v) => cleanInstagram(v)),
  about: optionalText(400),
  audience: optionalText(300),
  price_range: z
    .preprocess((v) => (v === "" ? undefined : v), z.enum(["budget", "mid", "premium"]).optional())
    .transform((v) => v ?? null),
});

// ─── Business profile ───────────────────────────────────────────────────────

export async function saveBusiness(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = businessSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { user, business } = await getMyBusiness();
  const supabase = await createClient();
  const { error } = business
    ? await supabase.from("businesses").update(parsed.data).eq("id", business.id)
    : await supabase.from("businesses").insert({ ...parsed.data, owner_id: user.id });

  if (error) return { error: "Couldn't save your business. Please try again." };
  redirect("/business");
}

// ─── Briefs ─────────────────────────────────────────────────────────────────

export async function createBrief(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = briefAnswersSchema.safeParse({
    ...Object.fromEntries(formData),
    vibes: formData.getAll("vibes"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { business } = await getMyBusiness();
  if (!business) redirect("/business/onboarding");

  const supabase = await createClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("briefs")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id)
    .gte("created_at", since);
  if ((count ?? 0) >= MAX_BRIEFS_PER_DAY) {
    return { error: "You've created a lot of briefs today. Try again tomorrow." };
  }

  const answers = parsed.data;
  const { data: brief, error } = await supabase
    .from("briefs")
    .insert({
      business_id: business.id,
      title: `${business.name}: ${answers.feature}`.slice(0, 120),
      goal: answers.goal,
      answers: answers as unknown as Json,
      deliverables: answers.deliverables,
      due_date: answers.due_date,
    })
    .select("*")
    .single();
  if (error || !brief) return { error: "Couldn't save your brief. Please try again." };

  const result = await runGeneration(brief, business, answers);
  redirect(`/business/briefs/${brief.id}${result === "ok" ? "" : `?ai=${result}`}`);
}

export async function regenerateBrief(briefId: string) {
  if (!isUuid(briefId)) redirect("/business");
  const { business } = await getMyBusiness();
  if (!business) redirect("/business/onboarding");

  const supabase = await createClient();
  const { data: brief } = await supabase
    .from("briefs")
    .select("*")
    .eq("id", briefId)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!brief) redirect("/business");
  if (brief.status !== "draft") redirect(`/business/briefs/${briefId}`);

  const answers = briefAnswersSchema.safeParse(brief.answers);
  if (!answers.success) redirect(`/business/briefs/${briefId}?ai=failed`);

  const result = await runGeneration(brief, business, answers.data);
  redirect(`/business/briefs/${briefId}${result === "ok" ? "" : `?ai=${result}`}`);
}

export async function setBriefStatus(briefId: string, status: "open" | "cancelled") {
  if (!isUuid(briefId) || (status !== "open" && status !== "cancelled")) redirect("/business");
  const { business } = await getMyBusiness();
  if (!business) redirect("/business/onboarding");

  const supabase = await createClient();
  const { data: brief } = await supabase
    .from("briefs")
    .select("id, status, ai_brief")
    .eq("id", briefId)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!brief) redirect("/business");

  // Only send briefs that have AI content; only draft/open briefs can change here.
  if (status === "open" && !brief.ai_brief) redirect(`/business/briefs/${briefId}`);
  if (brief.status !== "draft" && brief.status !== "open") redirect(`/business/briefs/${briefId}`);
  await supabase.from("briefs").update({ status }).eq("id", briefId);

  if (status === "cancelled") redirect("/business");
  refresh();
}

type GenerationResult = "ok" | "limit" | "not_configured" | "failed";

// Reserves one generation (optimistic lock on the counter, so parallel clicks
// can't exceed the cap), then asks Claude and stores the result.
async function runGeneration(
  brief: Brief,
  business: Business,
  answers: BriefAnswers,
): Promise<GenerationResult> {
  if (!aiConfigured()) return "not_configured"; // check before spending a generation
  if (brief.ai_generations >= MAX_AI_GENERATIONS) return "limit";

  const supabase = await createClient();
  const { data: reserved } = await supabase
    .from("briefs")
    .update({ ai_generations: brief.ai_generations + 1 })
    .eq("id", brief.id)
    .eq("ai_generations", brief.ai_generations)
    .select("id")
    .maybeSingle();
  if (!reserved) return "limit";
  if (!(await reserveAiUse("brief"))) return "limit";

  try {
    const ai = await generateAiBrief({ business, answers });
    const { error } = await supabase
      .from("briefs")
      .update({ ai_brief: ai as unknown as Json, title: ai.title.slice(0, 120) })
      .eq("id", brief.id);
    return error ? "failed" : "ok";
  } catch (err) {
    if (err instanceof AiNotConfiguredError) return "not_configured";
    console.error("[ai-brief] generation failed", { briefId: brief.id, err });
    return "failed";
  }
}

// ─── Reviewing reels ────────────────────────────────────────────────────────

const reviewSchema = z.object({
  decision: z.enum(["approved", "changes_requested"]),
  feedback: z.string().trim().max(1000),
});

export async function reviewSubmission(submissionId: string, _: FormState, formData: FormData): Promise<FormState> {
  if (!isUuid(submissionId)) return { error: "Reel not found." };
  const parsed = reviewSchema.safeParse({
    decision: formData.get("decision"),
    feedback: formData.get("feedback") ?? "",
  });
  if (!parsed.success) return { error: "Keep feedback under 1,000 characters." };
  const { decision, feedback } = parsed.data;
  if (decision === "changes_requested" && feedback.length < 3) {
    return { error: "Tell the creator what to change." };
  }

  const { business } = await getMyBusiness();
  if (!business) redirect("/business/onboarding");

  // RLS limits this to reels on this business's briefs; the database also
  // refuses to review a reel twice or to touch anything but status and feedback.
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("submissions")
    .update({ status: decision, feedback: feedback || null })
    .eq("id", submissionId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  if (error || !data) return { error: "This reel has already been reviewed." };
  refresh();
  return undefined;
}

// ─── Reel results (after posting) ───────────────────────────────────────────

const count = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : v),
  z.coerce.number().int().min(0).max(1_000_000_000).nullable(),
);

export async function saveReelResults(submissionId: string, _: FormState, formData: FormData): Promise<FormState> {
  if (!isUuid(submissionId)) return { error: "Reel not found." };
  const parsed = z.object({ views: count, likes: count }).safeParse({
    views: formData.get("views"),
    likes: formData.get("likes"),
  });
  if (!parsed.success) return { error: "Enter whole numbers for views and likes." };

  const { business } = await getMyBusiness();
  if (!business) redirect("/business/onboarding");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("submissions")
    .update(parsed.data)
    .eq("id", submissionId)
    .eq("status", "approved")
    .select("id")
    .maybeSingle();
  if (error || !data) return { error: "Results can only be saved for approved reels." };
  refresh();
  return undefined;
}

// ─── AI content plan and monthly report ─────────────────────────────────────

type AiDocResult = "ok" | "limit" | "not_configured" | "failed" | "no_data";

function aiDocRedirect(path: string, result: AiDocResult): never {
  redirect(result === "ok" ? path : `${path}${path.includes("?") ? "&" : "?"}ai=${result}`);
}

export async function createContentPlan() {
  const { business } = await getMyBusiness();
  if (!business) redirect("/business/onboarding");
  if (!aiConfigured()) aiDocRedirect("/business/plan", "not_configured");
  if (!(await reserveAiUse("calendar"))) aiDocRedirect("/business/plan", "limit");

  const supabase = await createClient();
  let result: AiDocResult = "ok";
  try {
    const { data: recent } = await supabase
      .from("briefs")
      .select("title")
      .eq("business_id", business.id)
      .neq("status", "cancelled")
      .order("created_at", { ascending: false })
      .limit(8);
    const plan = await generateCalendar({ business, recentTitles: (recent ?? []).map((r) => r.title) });
    const { error } = await supabase.from("ai_documents").upsert(
      {
        business_id: business.id,
        kind: "calendar",
        period: monthRange(currentMonth()).period,
        content: plan as unknown as Json,
      },
      { onConflict: "business_id,kind,period" },
    );
    if (error) result = "failed";
  } catch (err) {
    console.error("[ai-plan] generation failed", { businessId: business.id, err });
    result = "failed";
  }
  aiDocRedirect("/business/plan", result);
}

export async function createMonthlyReport(monthInput: string) {
  const month = parseMonth(monthInput);
  const path = `/business/report?month=${month}`;
  const { business } = await getMyBusiness();
  if (!business) redirect("/business/onboarding");

  const stats = await getMonthStats(business.id, month);
  if (stats.data.delivered === 0) aiDocRedirect(path, "no_data");
  if (!aiConfigured()) aiDocRedirect(path, "not_configured");
  if (!(await reserveAiUse("report"))) aiDocRedirect(path, "limit");

  let result: AiDocResult = "ok";
  try {
    const report = await generateReport({ business, data: stats.data });
    const supabase = await createClient();
    const { error } = await supabase.from("ai_documents").upsert(
      { business_id: business.id, kind: "report", period: stats.period, content: report as unknown as Json },
      { onConflict: "business_id,kind,period" },
    );
    if (error) result = "failed";
  } catch (err) {
    console.error("[ai-report] generation failed", { businessId: business.id, err });
    result = "failed";
  }
  aiDocRedirect(path, result);
}
