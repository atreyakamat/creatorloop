import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/icon.svg" alt="" width={28} height={28} className="rounded-lg" />
      <span>CreatorLoop</span>
    </Link>
  );
}

const variants = {
  primary: "bg-ink-950 text-sand-50 hover:bg-ink-900",
  accent: "bg-sunset-500 text-white hover:bg-sunset-600",
  ghost: "bg-transparent text-ink-950 hover:bg-sand-100",
  outline: "border border-ink-950/15 bg-white/60 text-ink-950 hover:bg-white",
} as const;

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60";

type Variant = keyof typeof variants;

export function Button({
  variant = "primary",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={cn(base, variants[variant], className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cn(base, variants[variant], className)} {...props} />;
}

export function Field({
  label,
  hint,
  ...props
}: ComponentProps<"input"> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-700">{label}</span>
      <input
        className="w-full rounded-xl border border-ink-950/10 bg-white px-4 py-3 text-base text-ink-950 placeholder:text-ink-500/70 focus:border-sunset-500 focus:outline-none focus:ring-2 focus:ring-sunset-500/20"
        {...props}
      />
      {hint ? <span className="mt-1 block text-xs text-ink-500">{hint}</span> : null}
    </label>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-[var(--radius-card)] border border-ink-950/8 bg-white p-6 shadow-sm", className)}>
      {children}
    </div>
  );
}
