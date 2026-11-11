import "server-only";
import { createClient } from "@/lib/supabase/server";
import { SUBMISSIONS_BUCKET } from "@/lib/video";


// Signed URLs (1 hour) for private videos. Storage policies decide who may sign:
// the creator, the business that owns the brief, or an admin.
export async function signVideoUrls(paths: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!paths.length) return map;
  const supabase = await createClient();
  const { data } = await supabase.storage.from(SUBMISSIONS_BUCKET).createSignedUrls(paths, 3600);
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) map.set(item.path, item.signedUrl);
  }
  return map;
}
