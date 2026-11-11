"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui";

export type NavItem = { href: string; label: string; exact?: boolean; also?: string[] };

export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Sections">
      {items.map((item) => {
        const active =
          (item.exact ? pathname === item.href : pathname.startsWith(item.href)) ||
          (item.also ?? []).some((prefix) => pathname.startsWith(prefix));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition-colors",
              active
                ? "border-sunset-500 font-medium text-ink-950"
                : "border-transparent text-ink-500 hover:text-ink-950",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export const businessNav: NavItem[] = [
  { href: "/business", label: "Briefs", exact: true, also: ["/business/briefs"] },
  { href: "/business/plan", label: "Content plan" },
  { href: "/business/report", label: "Report" },
  { href: "/business/billing", label: "Billing" },
  { href: "/business/onboarding", label: "My business" },
];

export const creatorNav: NavItem[] = [
  { href: "/creator", label: "Home", exact: true },
  { href: "/creator/briefs", label: "Briefs" },
  { href: "/creator/earnings", label: "Earnings" },
  { href: "/creator/profile", label: "Profile" },
];

export const adminNav: NavItem[] = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/briefs", label: "Briefs" },
  { href: "/admin/creators", label: "Creators" },
  { href: "/admin/businesses", label: "Businesses" },
  { href: "/admin/payouts", label: "Payouts" },
];
