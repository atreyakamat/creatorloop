import "server-only";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { matchSchema } from "@/lib/ai-docs";
import { aiBriefSchema } from "@/lib/briefs";
import { promptText } from "@/lib/safe";
import type { Brief, Business, CreatorProfile } from "@/lib/supabase/types";
import { AI_MODEL, DATA_RULE, anthropic } from "./client";

export type MatchCandidate = Pick<
  CreatorProfile,
  "id" | "display_name" | "bio" | "niches" | "followers" | "rate_per_reel" | "is_verified"
> & { note: string | null };

const SYSTEM = `You help CreatorLoop's admin choose a local creator in Goa for a business's reel brief.
Rank candidates by fit: niche match with the business type, what their bio says about their work, whether they applied and what they wrote, and whether their rate is workable. Follower count matters least.
Use only what is in each candidate's profile. Do not assume skills, locations or past clients that are not stated. If nobody is a clear fit, return fewer picks.
${DATA_RULE}`;

// Returns up to three candidates (by id) with a one-line reason each.
export async function suggestCreators(input: {
  brief: Pick<Brief, "title" | "deliverables" | "ai_brief">;
  business: Pick<Business, "name" | "category" | "area" | "price_range"> | null;
  candidates: MatchCandidate[];
}): Promise<Array<{ id: string; name: string; reason: string }>> {
  const candidates = input.candidates.slice(0, 40);
  const concept = aiBriefSchema.safeParse(input.brief.ai_brief);

  const list = candidates
    .map(
      (c, i) => `<candidate number="${i + 1}">
Niches: ${promptText(c.niches.join(", "))}
Bio: ${promptText(c.bio)}
Followers: ${c.followers ?? "not given"}
Rate per reel (INR): ${c.rate_per_reel ?? "not given"}
Verified by admin: ${c.is_verified ? "yes" : "no"}
Applied for this brief: ${c.note !== null ? `yes. Note: ${promptText(c.note, "no note")}` : "no"}
</candidate>`,
    )
    .join("\n");

  const message = await anthropic().messages.parse({
    model: AI_MODEL,
    max_tokens: 700,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `<brief>
Business type: ${promptText(input.business?.category)}
Area: ${promptText(input.business?.area, "Goa")}
Price range: ${promptText(input.business?.price_range)}
Title: ${promptText(input.brief.title)}
Idea: ${promptText(concept.success ? concept.data.concept : null)}
Reels needed: ${input.brief.deliverables}
</brief>

${list}

Pick up to 3 candidates by number.`,
      },
    ],
    output_config: { format: zodOutputFormat(matchSchema) },
  });

  const seen = new Set<number>();
  const picks: Array<{ id: string; name: string; reason: string }> = [];
  for (const pick of message.parsed_output?.picks ?? []) {
    const index = Math.trunc(pick.candidate) - 1;
    const candidate = candidates[index];
    // Ignore numbers that are not in the list (never trust ids from the model).
    if (!candidate || seen.has(index)) continue;
    seen.add(index);
    picks.push({ id: candidate.id, name: candidate.display_name, reason: pick.reason.slice(0, 300) });
    if (picks.length === 3) break;
  }
  return picks;
}
