"use client";

import type { CafeStatus } from "@pc-booking/shared";
import { useT } from "@/components/locale-provider";
import { cn } from "@/lib/utils";

export type StatusFilterValue = CafeStatus | "ALL";

const OPTIONS: StatusFilterValue[] = ["ALL", "PENDING", "APPROVED", "REJECTED", "SUSPENDED"];

export function StatusFilter({
  value,
  onChange,
}: {
  value: StatusFilterValue;
  onChange: (value: StatusFilterValue) => void;
}) {
  const t = useT();
  const label = (option: StatusFilterValue) =>
    option === "ALL" ? t("dash.statusAll") : t(`dash.status${option}`);

  return (
    <>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as StatusFilterValue)}
        aria-label={t("dash.colStatus")}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 sm:hidden"
      >
        {OPTIONS.map((option) => (
          <option key={option} value={option}>
            {label(option)}
          </option>
        ))}
      </select>
      <div
        role="tablist"
        aria-label={t("dash.colStatus")}
        className="hidden rounded-lg border border-slate-200 bg-slate-50 p-0.5 sm:inline-flex"
      >
        {OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={value === option}
            onClick={() => onChange(option)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition",
              value === option
                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                : "text-slate-500 hover:text-slate-800",
            )}
          >
            {label(option)}
          </button>
        ))}
      </div>
    </>
  );
}
