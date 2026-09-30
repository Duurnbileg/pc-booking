"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { useT } from "@/components/locale-provider";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StatCard } from "@/components/admin/stat-card";
import { SearchInput } from "@/components/admin/search-input";
import { Pagination } from "@/components/admin/pagination";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/admin/admin-states";
import { CustomerTable } from "@/components/admin/customer-table";
import { CustomerDetailsDrawer } from "@/components/admin/customer-details-drawer";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useAdminCustomers, useAdminStats } from "@/hooks/use-admin-queries";
import type { AdminCustomer } from "@/lib/types";

export default function AdminCustomersPage() {
  const t = useT();
  const [phone, setPhone] = useState("");
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<AdminCustomer | null>(null);
  const debouncedPhone = useDebouncedValue(phone.replace(/\D/g, ""), 300);

  useEffect(() => setPage(1), [debouncedPhone]);

  const stats = useAdminStats();
  const customers = useAdminCustomers({ phone: debouncedPhone || undefined, page });
  const data = customers.data;

  return (
    <>
      <AdminPageHeader title={t("dash.customersTitle")} subtitle={t("dash.customersHint")} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("dash.totalCustomers")}
          value={stats.data?.totalCustomers}
          icon={Users}
          loading={stats.isLoading}
        />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-4">
          <SearchInput
            value={phone}
            onChange={setPhone}
            placeholder={t("dash.searchPhone")}
            inputMode="tel"
          />
        </div>

        {customers.isLoading ? (
          <TableSkeleton rows={6} cols={3} />
        ) : customers.error ? (
          <ErrorState error={customers.error} onRetry={() => void customers.refetch()} />
        ) : !data?.customers.length ? (
          <EmptyState
            title={debouncedPhone ? t("dash.emptyFiltered") : t("dash.emptyCustomers")}
            hint={debouncedPhone ? t("dash.emptyFilteredHint") : undefined}
          />
        ) : (
          <>
            <CustomerTable customers={data.customers} onView={setViewing} />
            <Pagination
              page={data.page}
              pageSize={data.pageSize}
              total={data.total}
              onPageChange={setPage}
            />
          </>
        )}
      </section>

      <CustomerDetailsDrawer customer={viewing} onClose={() => setViewing(null)} />
    </>
  );
}
