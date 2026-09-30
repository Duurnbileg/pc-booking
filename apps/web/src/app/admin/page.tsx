"use client";

import Link from "next/link";
import { AlertCircle, ArrowRight, CheckCircle2, Clock, Monitor, Users } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StatCard } from "@/components/admin/stat-card";
import { ApproveButton, RejectButton } from "@/components/admin/moderation-buttons";
import { useCafeModeration } from "@/components/admin/use-cafe-moderation";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/admin/admin-states";
import { formatDate } from "@/components/admin/format";
import { useAdminCafes, useAdminStats } from "@/hooks/use-admin-queries";
import { formatMnt } from "@/lib/utils";

const PENDING_HREF = "/admin/pcs?status=PENDING";

export default function AdminOverviewPage() {
  const { t, locale } = useLocale();
  const stats = useAdminStats();
  const pending = useAdminCafes({ status: "PENDING", limit: 5 });
  const moderation = useCafeModeration();
  const pendingCount = stats.data?.pendingPCs ?? 0;

  return (
    <>
      <AdminPageHeader title={t("dash.overviewTitle")} subtitle={t("dash.overviewHint")} />

      {pendingCount > 0 ? (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-sm font-medium text-amber-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {t("dash.pendingBanner", { n: pendingCount })}
          </p>
          <Link
            href={PENDING_HREF}
            className="inline-flex items-center justify-center gap-1 rounded-lg bg-amber-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            {t("dash.review")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : null}

      {stats.error ? (
        <div className="rounded-xl border border-slate-200 bg-white">
          <ErrorState error={stats.error} onRetry={() => void stats.refetch()} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label={t("dash.totalPCs")} value={stats.data?.totalPCs} icon={Monitor} loading={stats.isLoading} />
          <StatCard label={t("dash.totalCustomers")} value={stats.data?.totalCustomers} icon={Users} loading={stats.isLoading} />
          <Link
            href={PENDING_HREF}
            className="rounded-xl transition hover:ring-2 hover:ring-amber-200"
          >
            <StatCard label={t("dash.pendingPCs")} value={stats.data?.pendingPCs} icon={Clock} loading={stats.isLoading} />
          </Link>
          <StatCard label={t("dash.approvedPCs")} value={stats.data?.approvedPCs} icon={CheckCircle2} loading={stats.isLoading} />
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">{t("dash.pendingReview")}</h2>
          <Link
            href={PENDING_HREF}
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            {t("dash.viewAll")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {pending.isLoading ? (
          <TableSkeleton rows={3} cols={4} />
        ) : pending.error ? (
          <ErrorState error={pending.error} onRetry={() => void pending.refetch()} />
        ) : !pending.data?.cafes.length ? (
          <EmptyState title={t("dash.noPending")} />
        ) : (
          <ul className="divide-y divide-slate-100">
            {pending.data.cafes.map((cafe) => (
              <li
                key={cafe.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{cafe.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {cafe.owner?.name ?? "—"} · {formatMnt(cafe.pricePerHour)} · {formatDate(cafe.createdAt, locale)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <ApproveButton
                    disabled={moderation.busyId === cafe.id}
                    onClick={() => moderation.request("approve", cafe)}
                  />
                  <RejectButton
                    disabled={moderation.busyId === cafe.id}
                    onClick={() => moderation.request("reject", cafe)}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {moderation.dialog}
    </>
  );
}
