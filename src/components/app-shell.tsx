import { Suspense, type ReactNode } from "react";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/ui";
import { signOut } from "@/app/(auth)/actions";
import type { CurrentUser } from "@/lib/auth";
import { NavLinks, type NavItem } from "@/components/nav-links";

const roleLabel = { business: "Business", creator: "Creator", admin: "Admin" } as const;

export function AppShell({ children, nav }: { children: ReactNode; nav?: NavItem[] }) {
  return (
    <div className="min-h-dvh bg-sand-50">
      <header className="sticky top-0 z-10 border-b border-ink-950/5 bg-sand-50/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <Logo />
          <form action={signOut}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-ink-700 hover:bg-sand-100"
            >
              <LogOut className="size-4" aria-hidden />
              <span>Log out</span>
            </button>
          </form>
        </div>
        {nav ? (
          <div className="mx-auto max-w-5xl px-2">
            <Suspense fallback={<div className="h-[42px]" />}>
              <NavLinks items={nav} />
            </Suspense>
          </div>
        ) : null}
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8">
        <Suspense fallback={<DashboardSkeleton />}>{children}</Suspense>
      </main>
    </div>
  );
}

export function Greeting({ user, children }: { user: CurrentUser; children?: ReactNode }) {
  const first = user.full_name.split(" ")[0] || "there";
  return (
    <div className="mb-8">
      <span className="inline-flex rounded-full bg-sunset-500/10 px-3 py-1 text-xs font-medium text-sunset-600">
        {roleLabel[user.role]}
      </span>
      <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">Hi {first}.</h1>
      {children ? <p className="mt-2 max-w-xl text-ink-500">{children}</p> : null}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-label="Loading">
      <div className="h-6 w-20 rounded-full bg-sand-200" />
      <div className="h-12 w-64 rounded-xl bg-sand-200" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-32 rounded-[var(--radius-card)] bg-sand-100" />
        ))}
      </div>
    </div>
  );
}

export function StepList({
  steps,
}: {
  steps: Array<{ title: string; body: string; done?: boolean; soon?: boolean }>;
}) {
  return (
    <ol className="space-y-3">
      {steps.map((s, i) => (
        <li key={s.title} className="flex gap-4 rounded-2xl border border-ink-950/8 bg-white p-5">
          <span
            className={
              s.done
                ? "grid size-8 shrink-0 place-items-center rounded-full bg-palm-500 text-sm font-semibold text-white"
                : "grid size-8 shrink-0 place-items-center rounded-full bg-sand-100 text-sm font-semibold text-ink-700"
            }
          >
            {s.done ? "✓" : i + 1}
          </span>
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 font-medium">
              {s.title}
              {s.soon ? (
                <span className="rounded-full bg-sand-100 px-2 py-0.5 text-[11px] font-medium text-ink-500">
                  Coming soon
                </span>
              ) : null}
            </p>
            <p className="mt-0.5 text-sm text-ink-500">{s.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
