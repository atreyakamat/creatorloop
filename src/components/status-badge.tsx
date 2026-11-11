import type { BriefStatus } from "@/lib/supabase/types";
import { cn } from "@/components/ui";

const styles: Record<BriefStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-sand-100 text-ink-700" },
  open: { label: "Finding a creator", className: "bg-sea-500/10 text-sea-600" },
  assigned: { label: "Creator assigned", className: "bg-sea-500/10 text-sea-600" },
  in_review: { label: "Ready to review", className: "bg-sunset-500/10 text-sunset-600" },
  approved: { label: "Approved", className: "bg-palm-500/15 text-palm-500" },
  completed: { label: "Completed", className: "bg-palm-500/15 text-palm-500" },
  cancelled: { label: "Cancelled", className: "bg-sand-100 text-ink-500" },
};

export function StatusBadge({ status }: { status: BriefStatus }) {
  const s = styles[status];
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", s.className)}>{s.label}</span>
  );
}
