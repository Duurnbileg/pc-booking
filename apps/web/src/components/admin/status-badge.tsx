"use client";

import {
  AdminCafeStatusSchema,
  type AdminCafeStatus,
  type CafeStatus,
} from "@pc-booking/shared";
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

/** Status picker styled like StatusBadge; a legacy SUSPENDED value is shown but not selectable. */
export function StatusSelect({
  status,
  label,
  disabled,
  onChange,
}: {
  status: CafeStatus;
  label: string;
  disabled?: boolean;
  onChange: (status: AdminCafeStatus) => void;
}) {
  const t = useT();
  return (
    <select
      value={status}
      disabled={disabled}
      aria-label={label}
      title={t("dash.changeStatus")}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        const next = AdminCafeStatusSchema.safeParse(e.target.value);
        if (next.success && next.data !== status) onChange(next.data);
      }}
      className={cn(
        "cursor-pointer rounded-full py-0.5 pl-2 pr-6 text-xs font-medium ring-1 ring-inset focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-wait disabled:opacity-50",
        STYLES[status],
      )}
    >
      {status === "SUSPENDED" ? (
        <option value="SUSPENDED" disabled>
          {t("dash.statusSUSPENDED")}
        </option>
      ) : null}
      {AdminCafeStatusSchema.options.map((option) => (
        <option key={option} value={option}>
          {t(`dash.status${option}`)}
        </option>
      ))}
    </select>
  );
}
