"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/safe";
import { getAdminBrief } from "@/lib/admin";
import { aiConfigured } from "@/lib/ai/client";
import { suggestCreators } from "@/lib/ai/match";
import { reserveAiUse } from "@/lib/ai/usage";

export type AdminState = { error?: string; ok?: string } | undefined;

// Every action re-checks the admin role on the server, and the database
// re-checks it again through RLS (is_admin()).

const amount = z.coerce
  .number({ error: "Enter an amount in rupees" })
  .int("Enter a whole number of rupees")
  .min(0, "Amount can't be negative")
  .max(10_000_000, "That amount is too large");

export async function assignCreator(briefId: string, _: AdminState, formData: FormData): Promise<AdminState> {
  await requireRole("admin");
  const creatorId = formData.get("creator_id");
  const budget = amount.safeParse(formData.get("budget_inr") || 0);
  if (!isUuid(briefId) || !isUuid(creatorId)) return { error: "Pick a creator." };
  if (!budget.success) return { error: budget.error.issues[0]?.message };

  const supabase = await createClient();
  const { data: creator } = await supabase
    .from("creator_profiles")
    .select("id, display_name, bio, instagram, niches")
    .eq("id", creatorId)
    .maybeSingle();
  if (!creator || !creator.display_name || !creator.bio || !creator.instagram || !creator.niches.length) {
    return { error: "That creator's profile isn't complete yet." };
  }

  const { data, error } = await supabase
    .from("briefs")
    .update({ assigned_creator_id: creatorId, status: "assigned", budget_inr: budget.data || null })
    .eq("id", briefId)
    .eq("status", "open") // never re-assign a brief that already has a creator working
    .select("id")
    .maybeSingle();
  if (error || !data) return { error: "This brief is no longer open." };
  refresh();
  return { ok: `Assigned to ${creator.display_name}.` };
}

export async function unassignCreator(briefId: string) {
  await requireRole("admin");
  if (!isUuid(briefId)) return;
  const supabase = await createClient();
  const { count } = await supabase.from("submissions").select("id", { count: "exact", head: true }).eq("brief_id", briefId);
  if ((count ?? 0) > 0) return; // work already delivered: keep the assignment
  await supabase
    .from("briefs")
    .update({ assigned_creator_id: null, status: "open" })
    .eq("id", briefId)
    .eq("status", "assigned");
  refresh();
}

export async function setCreatorVerified(creatorId: string, verified: boolean) {
  await requireRole("admin");
  if (!isUuid(creatorId)) return;
  const supabase = await createClient();
  await supabase.from("creator_profiles").update({ is_verified: verified === true }).eq("id", creatorId);
  refresh();
}

export async function closeBrief(briefId: string, _: AdminState, formData: FormData): Promise<AdminState> {
  await requireRole("admin");
  const parsed = amount.safeParse(formData.get("amount_inr"));
  const note = z.string().trim().max(300).safeParse(formData.get("note") ?? "");
  if (!isUuid(briefId)) return { error: "Brief not found." };
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  if (!note.success) return { error: "Keep the note under 300 characters." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_close_brief", {
    p_brief: briefId,
    p_amount: parsed.data,
    p_note: note.data,
  });
  if (error) return { error: "This brief isn't ready to close (all reels must be approved, and it can only be closed once)." };
  refresh();
  return { ok: "Brief completed and payout created." };
}

export async function markPayoutPaid(payoutId: string) {
  await requireRole("admin");
  if (!isUuid(payoutId)) return;
  const supabase = await createClient();
  await supabase
    .from("payouts")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", payoutId)
    .eq("status", "pending");
  refresh();
}

export async function cancelBriefAsAdmin(briefId: string) {
  await requireRole("admin");
  if (!isUuid(briefId)) return;
  const supabase = await createClient();
  await supabase.from("briefs").update({ status: "cancelled" }).eq("id", briefId).in("status", ["draft", "open", "assigned"]);
  refresh();
}

export type MatchState =
  | { error?: string; picks?: Array<{ id: string; name: string; reason: string }> }
  | undefined;

// AI shortlist for an open brief. It only suggests: the admin still assigns.
export async function suggestMatches(briefId: string): Promise<MatchState> {
  await requireRole("admin");
  if (!isUuid(briefId)) return { error: "Brief not found." };
  const found = await getAdminBrief(briefId);
  if (!found || found.brief.status !== "open") return { error: "This brief is no longer open." };
  if (!found.candidates.length) return { error: "No creators with a complete profile yet." };
  if (!aiConfigured()) return { error: "AI isn't switched on yet. Add ANTHROPIC_API_KEY to the server environment." };
  if (!(await reserveAiUse("match"))) return { error: "You've reached today's AI limit for matching." };

  try {
    const picks = await suggestCreators({
      brief: found.brief,
      business: found.business,
      candidates: found.candidates.map((c) => ({
        id: c.id,
        display_name: c.display_name,
        bio: c.bio,
        niches: c.niches,
        followers: c.followers,
        rate_per_reel: c.rate_per_reel,
        is_verified: c.is_verified,
        note: c.application ? (c.application.note ?? "") : null,
      })),
    });
    return picks.length ? { picks } : { error: "The AI didn't find a clear fit. Pick manually." };
  } catch (err) {
    console.error("[ai-match] failed", { briefId, err });
    return { error: "The AI couldn't suggest anyone just now. Try again in a moment." };
  }
}
