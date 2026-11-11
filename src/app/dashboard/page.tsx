import { Suspense } from "react";
import { redirect } from "next/navigation";
import { homeFor, requireUser } from "@/lib/auth";
import { DashboardSkeleton } from "@/components/app-shell";

// Single entry point after login (and the PWA start_url): sends each role home.
export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <Suspense fallback={<DashboardSkeleton />}>
        <RoleRedirect />
      </Suspense>
    </main>
  );
}

async function RoleRedirect() {
  const user = await requireUser();
  redirect(homeFor(user.role));
  return null;
}
