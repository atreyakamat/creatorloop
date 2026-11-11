"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { z } from "zod";
import { getMyCreator } from "@/lib/creator";
import { creatorProfileSchema, profileComplete } from "@/lib/creators";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/safe";

export type FormState = { error?: string; saved?: boolean } | undefined;

export async function saveCreatorProfile(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = creatorProfileSchema.safeParse({
    display_name: formData.get("display_name") ?? "",
    bio: formData.get("bio") ?? "",
    instagram: formData.get("instagram") ?? "",
    followers: formData.get("followers") ?? "",
    rate_per_reel: formData.get("rate_per_reel") ?? "",
    niches: formData.getAll("niches"),
    portfolio_urls: formData.getAll("portfolio_urls"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { user, profile } = await getMyCreator();
  if (!profile) return { error: "This account doesn't have a creator profile." };

  const supabase = await createClient();
  const { error } = await supabase.from("creator_profiles").update(parsed.data).eq("id", user.id);
  if (error) return { error: "Couldn't save your profile. Please try again." };
  refresh();
  return { saved: true };
}

export async function applyToBrief(briefId: string, _: FormState, formData: FormData): Promise<FormState> {
  if (!isUuid(briefId)) return { error: "Brief not found." };
  const note = z.string().trim().max(500).safeParse(formData.get("note") ?? "");
  if (!note.success) return { error: "Keep your note under 500 characters." };

  const { user, profile } = await getMyCreator();
  if (!profileComplete(profile)) redirect("/creator/profile?finish=1");

  const supabase = await createClient();
  const { error } = await supabase
    .from("brief_applications")
    .insert({ brief_id: briefId, creator_id: user.id, note: note.data || null });
  // 23505 = already applied; treat as success.
  if (error && error.code !== "23505") return { error: "This brief is no longer open." };
  refresh();
  return { saved: true };
}

export async function withdrawApplication(briefId: string) {
  if (!isUuid(briefId)) redirect("/creator/briefs");
  const { user } = await getMyCreator();
  const supabase = await createClient();
  await supabase.from("brief_applications").delete().eq("brief_id", briefId).eq("creator_id", user.id);
  refresh();
}

const reelSchema = z.object({
  briefId: z.string().refine(isUuid),
  path: z.string().max(300),
  caption: z.string().trim().max(2200),
});

// Called after the browser has uploaded the file straight to private storage.
export async function submitReel(input: { briefId: string; path: string; caption: string }): Promise<{ error?: string }> {
  const parsed = reelSchema.safeParse(input);
  if (!parsed.success) return { error: "Something was wrong with that upload. Please try again." };
  const { briefId, path, caption } = parsed.data;

  const { user } = await getMyCreator();
  // The file must sit in this creator's folder for this brief: <creator>/<brief>/<file>.
  if (!new RegExp(`^${user.id}/${briefId}/[0-9a-f-]{36}\\.(mp4|mov|webm)$`, "i").test(path)) {
    return { error: "Something was wrong with that upload. Please try again." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("submissions")
    .insert({ brief_id: briefId, creator_id: user.id, video_path: path, caption: caption || null });
  if (error) return { error: "Couldn't submit this reel. The brief may no longer be accepting uploads." };
  refresh();
  return {};
}
