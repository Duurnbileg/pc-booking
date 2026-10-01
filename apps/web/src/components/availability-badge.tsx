"use client";

import { cn } from "@/lib/utils";
import { useLocale } from "@/components/locale-provider";

export function AvailabilityBadge({
  available,
  total,
  className,
}: {
  available: number | null | undefined;
  total: number;
  className?: string;
}) {
  const { t } = useLocale();
  if (available === null || available === undefined) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-ink-700 px-2.5 py-1 text-xs text-ink-500",
          className,
        )}
      >
        {t("search.noLive")}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        available > 0
          ? "border-status-available/40 bg-status-available/10 text-status-available"
          : "border-status-reserved/40 bg-status-reserved/10 text-status-reserved",
        className,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          available > 0 ? "bg-status-available" : "bg-status-reserved",
        )}
      />
      {t("search.available", { a: available, t: total })}
    </span>
  );
}
