import { z } from "zod";

// ─── Questionnaire (what the business owner answers) ───────────────────────

export const GOALS = [
  { value: "footfall", label: "More walk-ins" },
  { value: "bookings", label: "More bookings or reservations" },
  { value: "launch", label: "Launch something new" },
  { value: "event", label: "Promote an event" },
  { value: "awareness", label: "Get known in the area" },
] as const;

export const VIBES = ["Cosy", "Lively", "Premium", "Quirky", "Family-friendly", "Laid-back", "Romantic"] as const;

export const CATEGORIES = [
  "Café",
  "Restaurant",
  "Bar",
  "Bakery",
  "Hotel or homestay",
  "Clothing or boutique",
  "Salon or spa",
  "Fitness or studio",
  "Experience or tour",
  "Other",
] as const;

export const briefAnswersSchema = z.object({
  goal: z.enum(GOALS.map((g) => g.value) as [string, ...string[]], { error: "Pick what you want more of" }),
  feature: z.string().trim().min(3, "Tell us what to feature").max(300),
  difference: z.string().trim().min(3, "Tell us what makes you different").max(400),
  offer: z.string().trim().max(200).optional().default(""),
  vibes: z.array(z.enum(VIBES)).min(1, "Pick at least one vibe").max(3, "Pick up to three vibes"),
  deliverables: z.coerce.number().int().min(1, "At least 1 reel").max(8, "Up to 8 reels per brief"),
  due_date: z
    .string()
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), "Pick a valid date"),
});

export type BriefAnswers = z.infer<typeof briefAnswersSchema>;

export function goalLabel(value: string) {
  return GOALS.find((g) => g.value === value)?.label ?? value;
}

// ─── AI output (what Claude returns) ───────────────────────────────────────

export const aiBriefSchema = z.object({
  title: z.string().describe("Short, specific title for this content brief, max 8 words"),
  concept: z.string().describe("Two or three sentences: the idea of the reel and why it will work for this goal"),
  hooks: z
    .array(z.string())
    .describe("Exactly 3 opening lines or on-screen text for the first 2 seconds, each under 15 words"),
  shots: z
    .array(
      z.object({
        shot: z.string().describe("What to film, concrete and shootable on a phone"),
        seconds: z.number().describe("Duration of the shot in seconds"),
        direction: z.string().describe("Camera, light or performance tip for the creator"),
      }),
    )
    .describe("5 to 8 shots in order, totalling 15 to 35 seconds"),
  captions: z.array(z.string()).describe("Exactly 2 Instagram caption options, each with a clear call to action"),
  hashtags: z.array(z.string()).describe("8 to 12 relevant hashtags without spaces, mixing local Goa tags and niche tags"),
  audio: z.string().describe("Type of trending audio or music mood to use, not a specific copyrighted song"),
  post_timing: z.string().describe("When to post this and why, considering Goa's season"),
  creator_notes: z.string().describe("Practical notes for the creator: what to bring, what to avoid, anything to confirm with the owner"),
});

export type AiBrief = z.infer<typeof aiBriefSchema>;

export const MAX_AI_GENERATIONS = 4; // per brief: first draft + 3 rewrites
export const MAX_BRIEFS_PER_DAY = 10; // per business
