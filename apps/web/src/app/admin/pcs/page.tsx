"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { AdminCafeStatusSchema } from "@pc-booking/shared";
import { useT } from "@/components/locale-provider";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SearchInput } from "@/components/admin/search-input";
import { StatusFilter, type StatusFilterValue } from "@/components/admin/status-filter";
import { Pagination } from "@/components/admin/pagination";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/admin/admin-states";
import { PcManagementTable, type PcAction } from "@/components/admin/pc-management-table";
import { PcDetailsDrawer } from "@/components/admin/pc-details-drawer";
import { CafeEditorDrawer } from "@/components/admin/cafe-editor-drawer";
import { useCafeModeration } from "@/components/admin/use-cafe-moderation";
import { useToast } from "@/components/admin/toast";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ADMIN_KEYS, useAdminCafes } from "@/hooks/use-admin-queries";
import type { AdminCafe } from "@/lib/types";

export default function AdminPcsPage() {
  return (
    <Suspense fallback={null}>
      <AdminPcsContent />
    </Suspense>
  );
}

function AdminPcsContent() {
  const t = useT();
  const toast = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const parsedStatus = AdminCafeStatusSchema.safeParse(params.get("status"));
  const status: StatusFilterValue = parsedStatus.success ? parsedStatus.data : "ALL";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const [search, setSearch] = useState(params.get("search") ?? "");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const setParams = useCallback(
    (next: Record<string, string | null>) => {
      const sp = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(next)) {
        if (value) sp.set(key, value);
        else sp.delete(key);
      }
      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  useEffect(() => {
    if (debouncedSearch !== (params.get("search") ?? "")) {
      setParams({ search: debouncedSearch || null, page: null });
    }
  }, [debouncedSearch, params, setParams]);

  const cafes = useAdminCafes({
    status: status === "ALL" ? undefined : status,
    search: debouncedSearch || undefined,
    page,
  });

  const [viewing, setViewing] = useState<AdminCafe | null>(null);
  const [editing, setEditing] = useState<AdminCafe | null | undefined>(undefined);
  const moderation = useCafeModeration({
    onDone: ({ cafe }) => {
      if (viewing?.id === cafe.id) setViewing(null);
    },
  });

  function onAction(action: PcAction, cafe: AdminCafe) {
    if (action === "view") setViewing(cafe);
    else if (action === "edit") setEditing(cafe);
    else moderation.request(action, cafe);
  }

  const data = cafes.data;
  const filtered = status !== "ALL" || Boolean(debouncedSearch);

  return (
    <>
      <AdminPageHeader
        title={t("dash.pcsTitle")}
        subtitle={t("dash.pcsHint")}
        actions={
          <button
            type="button"
            onClick={() => setEditing(null)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            {t("dash.addPc")}
          </button>
        }
      />

      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput value={search} onChange={setSearch} placeholder={t("dash.searchPcs")} />
          <StatusFilter
            value={status}
            onChange={(value) => setParams({ status: value === "ALL" ? null : value, page: null })}
          />
        </div>

        {cafes.isLoading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : cafes.error ? (
          <ErrorState error={cafes.error} onRetry={() => void cafes.refetch()} />
        ) : !data?.cafes.length ? (
          <EmptyState
            title={filtered ? t("dash.emptyFiltered") : t("dash.emptyPcs")}
            hint={filtered ? t("dash.emptyFilteredHint") : undefined}
          />
        ) : (
          <>
            <PcManagementTable
              cafes={data.cafes}
              busyId={moderation.busyId}
              onAction={onAction}
              onStatusChange={moderation.setStatus}
            />
            <Pagination
              page={data.page}
              pageSize={data.pageSize}
              total={data.total}
              onPageChange={(next) => setParams({ page: next > 1 ? String(next) : null })}
            />
          </>
        )}
      </section>

      <PcDetailsDrawer
        cafe={viewing}
        onClose={() => setViewing(null)}
        busy={Boolean(viewing && moderation.busyId === viewing.id)}
        onStatusChange={moderation.setStatus}
        onAction={(action, cafe) => {
          if (action === "edit") {
            setViewing(null);
            setEditing(cafe);
          } else {
            moderation.request(action, cafe);
          }
        }}
      />

      <CafeEditorDrawer
        cafe={editing}
        onClose={() => setEditing(undefined)}
        onSaved={async (created) => {
          setEditing(undefined);
          toast.success(created ? t("dash.createdToast") : t("dash.savedToast"));
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.cafes }),
            queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.stats }),
            queryClient.invalidateQueries({ queryKey: ["cafes"] }),
          ]);
        }}
      />

      {moderation.dialog}
    </>
  );
}
