import { z } from "zod";
import { cleanInstagram, safeHttpUrl } from "@/lib/safe";
import type { CreatorProfile } from "@/lib/supabase/types";

export const NICHES = [
  "Food",
  "Cafés",
  "Travel",
  "Hotels & stays",
  "Fashion",
  "Lifestyle",
  "Fitness",
  "Nightlife",
  "Events",
  "Weddings",
  "Beauty",
  "Adventure",
] as const;

const optionalInt = (max: number, message: string) =>
  z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? null : v),
    z.coerce.number({ error: message }).int(message).min(0, message).max(max, message).nullable(),
  );

export const creatorProfileSchema = z.object({
  display_name: z.string().trim().min(2, "Enter the name businesses should see").max(60),
  bio: z.string().trim().min(20, "Write a couple of lines about your work (20+ characters)").max(600),
  instagram: z
    .string()
    .transform((v) => cleanInstagram(v))
    .refine((v): v is string => v !== null, "Enter a valid Instagram handle"),
  niches: z.array(z.enum(NICHES)).min(1, "Pick at least one niche").max(5, "Pick up to five niches"),
  followers: optionalInt(100_000_000, "Followers must be a whole number"),
  rate_per_reel: optionalInt(1_000_000, "Rate must be a whole number of rupees"),
  portfolio_urls: z
    .array(z.string())
    .transform((urls) => urls.map((u) => u.trim()).filter(Boolean))
    .refine((urls) => urls.length <= 3, "Up to three links")
    .refine((urls) => urls.every((u) => safeHttpUrl(u) !== null), "Portfolio links must start with https://")
    .transform((urls) => urls.map((u) => safeHttpUrl(u)!).filter((u) => u.length <= 300)),
});

export type CreatorProfileInput = z.infer<typeof creatorProfileSchema>;

export function profileComplete(p: Pick<CreatorProfile, "display_name" | "bio" | "instagram" | "niches"> | null) {
  return Boolean(p && p.display_name && p.bio && p.instagram && p.niches.length);
}
