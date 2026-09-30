"use client";

import type { CafeStatus } from "@pc-booking/shared";
import { useT } from "@/components/locale-provider";
import { cn } from "@/lib/utils";

const STYLES: Record<CafeStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  REJECTED: "bg-red-50 text-red-700 ring-red-200",
  SUSPENDED: "bg-slate-100 text-slate-600 ring-slate-200",
};

export function StatusBadge({ status }: { status: CafeStatus }) {
  const t = useT();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        STYLES[status],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {t(`dash.status${status}`)}
    </span>
  );
}
