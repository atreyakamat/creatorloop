import { z } from "zod";

// Shapes of the AI-written documents. Used to request structured output from
// Claude and to validate stored documents before rendering them.

export const calendarSchema = z.object({
  summary: z.string().describe("Two sentences: the content focus for the next four weeks and why"),
  weeks: z
    .array(
      z.object({
        label: z.string().describe("Week label with dates, e.g. 'Week 1: 17–23 Nov'"),
        theme: z.string().describe("Theme for the week in under 8 words"),
        ideas: z
          .array(
            z.object({
              title: z.string().describe("Reel idea in under 10 words"),
              hook: z.string().describe("Opening line or on-screen text, under 15 words"),
              why_now: z.string().describe("Why this fits this week: season, day of week, local rhythm"),
            }),
          )
          .describe("Exactly 2 reel ideas"),
      }),
    )
    .describe("Exactly 4 weeks, starting from today"),
});
export type ContentCalendar = z.infer<typeof calendarSchema>;

export const reportSchema = z.object({
  headline: z.string().describe("One sentence summing up the month, using only the numbers provided"),
  what_worked: z.array(z.string()).describe("1 to 3 observations grounded in the data provided"),
  to_improve: z.array(z.string()).describe("1 to 3 specific things to do differently"),
  next_steps: z.array(z.string()).describe("2 or 3 concrete content actions for next month"),
});
export type MonthlyReport = z.infer<typeof reportSchema>;

export const matchSchema = z.object({
  picks: z
    .array(
      z.object({
        candidate: z.number().describe("The candidate's number from the list"),
        reason: z.string().describe("One sentence on why they fit this brief, based only on their profile"),
      }),
    )
    .describe("Up to 3 best-fit candidates, best first"),
});

// ── Month helpers (India time) ──────────────────────────────────────────────

export function currentMonth(now = new Date()): string {
  const [y, m] = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }).split("-");
  return `${y}-${m}`;
}

export function parseMonth(value: unknown, fallback = currentMonth()): string {
  return typeof value === "string" && /^20\d{2}-(0[1-9]|1[0-2])$/.test(value) && value <= currentMonth() ? value : fallback;
}

export function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const start = new Date(`${month}-01T00:00:00+05:30`);
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  const end = new Date(`${next}-01T00:00:00+05:30`);
  return { start, end, period: `${month}-01` };
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(month: string) {
  return new Date(`${month}-15T00:00:00Z`).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });
}
