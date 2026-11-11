import "server-only";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { calendarSchema, reportSchema, type ContentCalendar, type MonthlyReport } from "@/lib/ai-docs";
import { promptText } from "@/lib/safe";
import type { Business } from "@/lib/supabase/types";
import { AI_MODEL, DATA_RULE, anthropic, todayInGoa } from "./client";

type BusinessFacts = Pick<Business, "name" | "category" | "area" | "about" | "audience" | "price_range">;

function businessBlock(b: BusinessFacts) {
  return `<business>
Name: ${promptText(b.name)}
Type: ${promptText(b.category)}
Area: ${promptText(b.area, "Goa")}
What they offer: ${promptText(b.about)}
Who comes in today: ${promptText(b.audience)}
Price range: ${promptText(b.price_range)}
</business>`;
}

const PLAN_SYSTEM = `You are CreatorLoop's content strategist for small businesses in Goa, India. You plan four weeks of short-form reels that a local creator can shoot on a phone at the business.
- Time ideas to what is really happening in Goa around the given date: tourist season or monsoon, weekends versus weekdays, widely known public festivals and holidays. If you are not sure a festival or event falls in a given week, do not mention it.
- Each idea must be specific to this business and shootable on site.
- Never invent prices, offers, awards or events at the business.
- Plain, warm language.
${DATA_RULE}`;

export async function generateCalendar(input: { business: BusinessFacts; recentTitles: string[]; now?: Date }): Promise<ContentCalendar> {
  const message = await anthropic().messages.parse({
    model: AI_MODEL,
    max_tokens: 1800,
    system: PLAN_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Today is ${todayInGoa(input.now)}.

${businessBlock(input.business)}

<recent_reels>
${input.recentTitles.length ? input.recentTitles.map((t) => `- ${promptText(t)}`).join("\n") : "none yet"}
</recent_reels>

Plan the next four weeks, starting today. Avoid repeating the recent reels.`,
      },
    ],
    output_config: { format: zodOutputFormat(calendarSchema) },
  });
  const parsed = message.parsed_output;
  if (!parsed) throw new Error(`AI returned no plan (stop_reason: ${message.stop_reason})`);
  return parsed;
}

const REPORT_SYSTEM = `You write a short monthly content report for a small business in Goa that uses CreatorLoop.
- Use only the numbers and facts in <month_data>. Never estimate, extrapolate or invent a number, a trend, a benchmark or an industry average.
- If views and likes were not logged, say that results weren't logged and base your points only on what was delivered and approved.
- With very little data, say so plainly instead of drawing conclusions.
- Be specific and practical. Plain language, no hype.
${DATA_RULE}`;

export type ReportData = {
  month: string;
  delivered: number;
  approved: number;
  changesRequested: number;
  totalViews: number | null;
  totalLikes: number | null;
  reels: Array<{ brief: string; status: string; views: number | null; likes: number | null }>;
};

export async function generateReport(input: { business: BusinessFacts; data: ReportData }): Promise<MonthlyReport> {
  const { data } = input;
  const reels = data.reels
    .slice(0, 40)
    .map((r, i) => `${i + 1}. Brief: ${promptText(r.brief)} | status: ${r.status} | views: ${r.views ?? "not logged"} | likes: ${r.likes ?? "not logged"}`)
    .join("\n");

  const message = await anthropic().messages.parse({
    model: AI_MODEL,
    max_tokens: 900,
    system: REPORT_SYSTEM,
    messages: [
      {
        role: "user",
        content: `${businessBlock(input.business)}

<month_data>
Month: ${data.month}
Reels delivered: ${data.delivered}
Reels approved: ${data.approved}
Reels sent back for changes: ${data.changesRequested}
Total views logged: ${data.totalViews ?? "not logged"}
Total likes logged: ${data.totalLikes ?? "not logged"}
Reels:
${reels || "none"}
</month_data>

Write the report.`,
      },
    ],
    output_config: { format: zodOutputFormat(reportSchema) },
  });
  const parsed = message.parsed_output;
  if (!parsed) throw new Error(`AI returned no report (stop_reason: ${message.stop_reason})`);
  return parsed;
}
