import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/supabase/types";

export type CurrentUser = Pick<Profile, "id" | "role" | "full_name" | "city"> & {
  email: string | null;
};

// Data Access Layer: the one place that turns a session cookie into a user.
// Reads the request, so callers must sit behind a <Suspense> boundary.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (!claims?.sub) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, city")
    .eq("id", claims.sub)
    .single();

  if (!profile) return null;
  return { ...profile, email: typeof claims.email === "string" ? claims.email : null };
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

// Admins can open every area; everyone else only their own.
export async function requireRole(role: UserRole): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== role && user.role !== "admin") redirect(homeFor(user.role));
  return user;
}

export function homeFor(role: UserRole) {
  return role === "admin" ? "/admin" : role === "creator" ? "/creator" : "/business";
}
