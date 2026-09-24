import type { PcStatus } from "@pc-booking/shared";
import { cn } from "@/lib/utils";

const STATUS_META: Record<
  PcStatus,
  { label: string; className: string; dot: string }
> = {
  AVAILABLE: {
    label: "Available",
    className: "border-status-available/40 bg-status-available/10 text-status-available",
    dot: "bg-status-available",
  },
  IN_USE: {
    label: "In use",
    className: "border-status-inuse/40 bg-status-inuse/10 text-status-inuse",
    dot: "bg-status-inuse",
  },
  RESERVED: {
    label: "Reserved",
    className: "border-status-reserved/40 bg-status-reserved/10 text-status-reserved",
    dot: "bg-status-reserved",
  },
  OFFLINE: {
    label: "Offline",
    className: "border-status-offline/40 bg-status-offline/10 text-status-offline",
    dot: "bg-status-offline",
  },
  MAINTENANCE: {
    label: "Maintenance",
    className:
      "border-status-maintenance/40 bg-status-maintenance/10 text-status-maintenance",
    dot: "bg-status-maintenance",
  },
};

export function PcStatusBadge({ status }: { status: PcStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium",
        meta.className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

export function PcStatusLegend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs text-ink-300">
      {(Object.keys(STATUS_META) as PcStatus[]).map((status) => (
        <div key={status} className="flex items-center gap-1.5">
          <span className={cn("h-2 w-2 rounded-full", STATUS_META[status].dot)} />
          {STATUS_META[status].label}
        </div>
      ))}
    </div>
  );
}
