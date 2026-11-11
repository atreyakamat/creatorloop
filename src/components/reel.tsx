import { cn } from "@/components/ui";
import type { SubmissionStatus } from "@/lib/supabase/types";

const statusStyle: Record<SubmissionStatus, { label: string; className: string }> = {
  pending: { label: "Waiting for review", className: "bg-sunset-500/10 text-sunset-600" },
  changes_requested: { label: "Changes requested", className: "bg-sand-200 text-ink-700" },
  approved: { label: "Approved", className: "bg-palm-500/15 text-palm-500" },
};

export function ReelStatus({ status }: { status: SubmissionStatus }) {
  const s = statusStyle[status];
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", s.className)}>{s.label}</span>;
}

// Private video played through a short-lived signed URL.
export function ReelPlayer({ url }: { url: string | null }) {
  if (!url) {
    return (
      <div className="grid aspect-[9/16] w-full max-w-[220px] place-items-center rounded-2xl bg-sand-100 text-sm text-ink-500">
        Video unavailable
      </div>
    );
  }
  return (
    <video
      src={url}
      controls
      playsInline
      preload="metadata"
      className="aspect-[9/16] w-full max-w-[220px] rounded-2xl bg-ink-950 object-contain"
    />
  );
}
