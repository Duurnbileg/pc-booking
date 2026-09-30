"use client";

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { API_PATHS } from "@pc-booking/shared";
import { api } from "@/lib/api";
import { useLocale } from "@/components/locale-provider";
import { Drawer } from "@/components/admin/drawer";
import { StatusBadge } from "@/components/admin/status-badge";
import { ApproveButton, RejectButton } from "@/components/admin/moderation-buttons";
import { ErrorState } from "@/components/admin/admin-states";
import { formatDate } from "@/components/admin/format";
import { ADMIN_KEYS } from "@/hooks/use-admin-queries";
import type { AdminCafe } from "@/lib/types";
import { districtLabel, formatMnt } from "@/lib/utils";

export function PcDetailsDrawer({
  cafe: initial,
  onClose,
  onAction,
  busy,
}: {
  cafe: AdminCafe | null;
  onClose: () => void;
  onAction: (action: "approve" | "reject" | "delete" | "edit", cafe: AdminCafe) => void;
  busy?: boolean;
}) {
  const { t, locale } = useLocale();
  const detail = useQuery({
    queryKey: [...ADMIN_KEYS.cafes, "detail", initial?.id],
    enabled: Boolean(initial),
    queryFn: () => api<{ cafe: AdminCafe }>(API_PATHS.admin.cafeById(initial!.id)),
  });
  const cafe = detail.data?.cafe ?? initial;

  const footer = cafe ? (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <button
        type="button"
        onClick={() => onAction("delete", cafe)}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
        {t("dash.delete")}
      </button>
      <div className="flex gap-2">
        {cafe.status === "PENDING" ? (
          <>
            <RejectButton size="md" disabled={busy} onClick={() => onAction("reject", cafe)} />
            <ApproveButton size="md" disabled={busy} onClick={() => onAction("approve", cafe)} />
          </>
        ) : cafe.status === "APPROVED" ? (
          <button
            type="button"
            onClick={() => onAction("edit", cafe)}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Pencil className="h-4 w-4" />
            {t("dash.edit")}
          </button>
        ) : (
          <ApproveButton size="md" disabled={busy} onClick={() => onAction("approve", cafe)} />
        )}
      </div>
    </div>
  ) : undefined;

  return (
    <Drawer open={Boolean(initial)} title={cafe?.name ?? ""} onClose={onClose} footer={footer}>
      {detail.error ? (
        <ErrorState error={detail.error} onRetry={() => void detail.refetch()} />
      ) : cafe ? (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <StatusBadge status={cafe.status} />
            <span className="text-xs text-slate-500">
              {t("dash.created")}: {formatDate(cafe.createdAt, locale, true)}
            </span>
          </div>

          {cafe.status === "REJECTED" && cafe.rejectionReason ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <span className="font-medium">{t("dash.rejectionReason")}: </span>
              {cafe.rejectionReason}
            </div>
          ) : null}

          {cafe.images.length ? (
            <div className="grid grid-cols-3 gap-2">
              {cafe.images.map((url) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={url}
                  src={url}
                  alt=""
                  className="aspect-[4/3] w-full rounded-md border border-slate-200 object-cover"
                />
              ))}
            </div>
          ) : null}

          <DetailSection title={t("dash.details")}>
            <DetailRow label={t("dash.price")} value={`${formatMnt(cafe.pricePerHour)}${t("home.perHour")}`} />
            <DetailRow label={t("dash.pcCount")} value={String(cafe.pcCount ?? 0)} />
            <DetailRow label={t("dash.location")} value={districtLabel(cafe.district, locale)} />
            <DetailRow label={t("dash.address")} value={cafe.address} />
            <DetailRow label={t("dash.phone")} value={cafe.phone} />
            <DetailRow label={t("dash.specs")} value={cafe.displaySpecs} />
            <DetailRow label={t("dash.gear")} value={cafe.gear} />
          </DetailSection>

          <DetailSection title={t("dash.owner")}>
            <DetailRow label={t("dash.name")} value={cafe.owner?.name} />
            <DetailRow label={t("dash.email")} value={cafe.owner?.email} />
            <DetailRow label={t("dash.phone")} value={cafe.owner?.phone} />
          </DetailSection>

          {cafe.description ? (
            <DetailSection title={t("dash.description")}>
              <p className="whitespace-pre-line text-sm text-slate-700">{cafe.description}</p>
            </DetailSection>
          ) : null}
        </div>
      ) : null}
    </Drawer>
  );
}

export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <dl className="divide-y divide-slate-100 rounded-lg border border-slate-200">{children}</dl>
    </section>
  );
}

export function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-3 gap-3 px-3 py-2 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="col-span-2 break-words text-slate-900">{value || "—"}</dd>
    </div>
  );
}
