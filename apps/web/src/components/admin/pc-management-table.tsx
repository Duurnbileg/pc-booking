"use client";

import type { CafeStatus } from "@pc-booking/shared";
import { Eye, Pencil, Trash2, type LucideIcon } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { StatusBadge } from "@/components/admin/status-badge";
import { ApproveButton, RejectButton } from "@/components/admin/moderation-buttons";
import { formatDate } from "@/components/admin/format";
import type { AdminCafe } from "@/lib/types";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import { cn, districtLabel, formatMnt } from "@/lib/utils";

export type PcAction = "view" | "edit" | "approve" | "reject" | "delete";

type IconAction = "view" | "edit" | "delete";

const ICON_ACTIONS_BY_STATUS: Record<CafeStatus, IconAction[]> = {
  PENDING: ["view", "delete"],
  APPROVED: ["view", "edit", "delete"],
  REJECTED: ["view", "delete"],
  SUSPENDED: ["view", "delete"],
};

const ICON_META: Record<IconAction, { icon: LucideIcon; label: TranslationKey; className: string }> = {
  view: { icon: Eye, label: "dash.view", className: "text-slate-500 hover:bg-slate-100 hover:text-slate-900" },
  edit: { icon: Pencil, label: "dash.edit", className: "text-slate-500 hover:bg-slate-100 hover:text-slate-900" },
  delete: { icon: Trash2, label: "dash.delete", className: "text-red-600 hover:bg-red-50" },
};

export function PcManagementTable({
  cafes,
  busyId,
  onAction,
}: {
  cafes: AdminCafe[];
  busyId: string | null;
  onAction: (action: PcAction, cafe: AdminCafe) => void;
}) {
  const { t, locale } = useLocale();
  const th = "px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500";
  // Pinned so approve/reject stay visible when the table scrolls horizontally.
  const stickyCell = "sticky right-0 shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.12)]";

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[780px] w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th className={th}>{t("dash.colPc")}</th>
            <th className={th}>{t("dash.colOwner")}</th>
            <th className={cn(th, "hidden xl:table-cell")}>{t("dash.colLocation")}</th>
            <th className={cn(th, "text-right")}>{t("dash.colPrice")}</th>
            <th className={th}>{t("dash.colStatus")}</th>
            <th className={th}>{t("dash.colDate")}</th>
            <th className={cn(th, stickyCell, "bg-slate-50 text-right")}>{t("dash.colActions")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {cafes.map((cafe) => (
            <tr key={cafe.id} className="group hover:bg-slate-50">
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => onAction("view", cafe)}
                  className="flex items-center gap-3 text-left"
                >
                  <span className="h-9 w-12 shrink-0 overflow-hidden rounded-md bg-slate-100">
                    {cafe.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cafe.images[0]} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </span>
                  <span className="max-w-[180px] truncate font-medium text-slate-900 hover:underline">
                    {cafe.name}
                  </span>
                </button>
              </td>
              <td className="px-4 py-3">
                <p className="max-w-[160px] truncate text-slate-900">{cafe.owner?.name ?? "—"}</p>
                <p className="max-w-[160px] truncate text-xs text-slate-500">{cafe.owner?.email}</p>
              </td>
              <td className="hidden px-4 py-3 xl:table-cell">
                <p className="text-slate-900">{districtLabel(cafe.district, locale) || "—"}</p>
                <p className="max-w-[200px] truncate text-xs text-slate-500">{cafe.address}</p>
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-900">
                {formatMnt(cafe.pricePerHour)}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={cafe.status} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                {formatDate(cafe.createdAt, locale)}
              </td>
              <td className={cn("px-4 py-3", stickyCell, "bg-white group-hover:bg-slate-50")}>
                <div className="flex items-center justify-end gap-1">
                  {cafe.status === "PENDING" ? (
                    <>
                      <ApproveButton
                        disabled={busyId === cafe.id}
                        onClick={() => onAction("approve", cafe)}
                      />
                      <RejectButton
                        disabled={busyId === cafe.id}
                        onClick={() => onAction("reject", cafe)}
                      />
                    </>
                  ) : cafe.status !== "APPROVED" ? (
                    <ApproveButton
                      variant="outline"
                      disabled={busyId === cafe.id}
                      onClick={() => onAction("approve", cafe)}
                    />
                  ) : null}
                  {ICON_ACTIONS_BY_STATUS[cafe.status].map((action) => {
                    const { icon: Icon, label, className } = ICON_META[action];
                    return (
                      <button
                        key={action}
                        type="button"
                        title={t(label)}
                        aria-label={`${t(label)}: ${cafe.name}`}
                        disabled={busyId === cafe.id}
                        onClick={() => onAction(action, cafe)}
                        className={cn("rounded-md p-1.5 transition disabled:opacity-40", className)}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
