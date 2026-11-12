// Public Supabase config. Read lazily so the static landing page builds
// without credentials; anything that talks to Supabase fails loudly instead.
export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing Supabase env. Copy .env.example to .env.local and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }
  return { url, key };
}

export function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

// Landing-only mode: publish the marketing page with a waitlist before the app
// itself is switched on. Set NEXT_PUBLIC_LANDING_ONLY=1 (the `landing` branch does).
export function landingOnly() {
  return process.env.NEXT_PUBLIC_LANDING_ONLY === "1";
}
