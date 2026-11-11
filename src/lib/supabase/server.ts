import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { supabaseEnv } from "@/lib/env";
import type { Database } from "./types";

// Request-scoped Supabase client for Server Components, Server Actions and Route Handlers.
export async function createClient() {
  // The Supabase client reads the clock when it loads the session. Marking this as
  // request-time work keeps Next.js from trying to prerender or prefetch it.
  await connection();
  const cookieStore = await cookies();
  const { url, key } = supabaseEnv();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component: cookies are read-only there.
          // The proxy refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}
