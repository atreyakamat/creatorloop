import { test } from "node:test";
import assert from "node:assert/strict";
import { calendarSchema, currentMonth, matchSchema, monthLabel, monthRange, parseMonth, reportSchema, shiftMonth } from "../../src/lib/ai-docs";
import { aiBriefSchema, briefAnswersSchema } from "../../src/lib/briefs";
import { creatorProfileSchema, profileComplete } from "../../src/lib/creators";

test("currentMonth uses India time", () => {
  // 31 Oct 2026 20:00 UTC is already 1 Nov in Goa.
  assert.equal(currentMonth(new Date("2026-10-31T20:00:00Z")), "2026-11");
});

test("parseMonth rejects garbage and future months", () => {
  const now = currentMonth();
  assert.equal(parseMonth("2026-01"), "2026-01");
  for (const bad of ["2026-13", "26-01", "2026-1", "2026-01-01", "'; drop table", undefined, shiftMonth(now, 1)]) {
    assert.equal(parseMonth(bad), now, String(bad));
  }
});

test("monthRange covers the month in India time and rolls over December", () => {
  const nov = monthRange("2026-11");
  assert.equal(nov.period, "2026-11-01");
  assert.equal(nov.start.toISOString(), "2026-10-31T18:30:00.000Z");
  assert.equal(nov.end.toISOString(), "2026-11-30T18:30:00.000Z");
  assert.equal(monthRange("2026-12").end.toISOString(), "2026-12-31T18:30:00.000Z");
  assert.equal(shiftMonth("2026-01", -1), "2025-12");
  assert.equal(shiftMonth("2026-12", 1), "2027-01");
  assert.equal(monthLabel("2026-11"), "November 2026");
});

test("stored AI documents with the wrong shape are rejected", () => {
  assert.ok(!calendarSchema.safeParse({ summary: "x" }).success);
  assert.ok(!reportSchema.safeParse({ headline: 1 }).success);
  assert.ok(!matchSchema.safeParse({ picks: [{ candidate: "1" }] }).success);
  assert.ok(!aiBriefSchema.safeParse({ title: "<script>" }).success);
});

test("brief answers validation", () => {
  const ok = briefAnswersSchema.safeParse({ goal: "footfall", feature: "Prawn rava fry", difference: "Family recipes", offer: "", vibes: ["Cosy"], deliverables: "4", due_date: "" });
  assert.ok(ok.success && ok.data.deliverables === 4 && ok.data.due_date === null);
  assert.ok(!briefAnswersSchema.safeParse({ goal: "x", feature: "a", difference: "b", vibes: [], deliverables: "20" }).success);
});

test("creator profile validation", () => {
  const base = { display_name: "Asha", bio: "I shoot food reels around North Goa.", instagram: "@asha.reels", niches: ["Food"], followers: "", rate_per_reel: "1500", portfolio_urls: ["https://instagram.com/reel/x", "", ""] };
  const ok = creatorProfileSchema.safeParse(base);
  assert.ok(ok.success);
  assert.deepEqual(ok.success && [ok.data.instagram, ok.data.followers, ok.data.rate_per_reel, ok.data.portfolio_urls.length], ["asha.reels", null, 1500, 1]);
  assert.ok(!creatorProfileSchema.safeParse({ ...base, portfolio_urls: ["javascript:alert(1)"] }).success);
  assert.ok(!creatorProfileSchema.safeParse({ ...base, instagram: "<script>" }).success);
  assert.ok(!creatorProfileSchema.safeParse({ ...base, rate_per_reel: "-5" }).success);
  assert.ok(!creatorProfileSchema.safeParse({ ...base, niches: ["Hacking"] }).success);
  assert.ok(profileComplete({ display_name: "A", bio: "b", instagram: "c", niches: ["Food"] }));
  assert.ok(!profileComplete({ display_name: "A", bio: null, instagram: "c", niches: ["Food"] }));
});
