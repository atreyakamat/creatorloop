// Shared by the browser uploader and the server. Must match the bucket limits
// in supabase/migrations/0003_security_hardening.sql.
export const SUBMISSIONS_BUCKET = "submissions";
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export const VIDEO_TYPES: Record<string, string> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};
