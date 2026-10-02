"use client";

import { Eye } from "lucide-react";
import { AssignableRoleSchema, type AssignableRole } from "@pc-booking/shared";
import { useLocale } from "@/components/locale-provider";
import { formatDate } from "@/components/admin/format";
import type { AdminCustomer } from "@/lib/types";
import { cn } from "@/lib/utils";

const ROLE_STYLES: Record<AssignableRole, string> = {
  CUSTOMER: "bg-white text-slate-700 ring-slate-200",
  CAFE_OWNER: "bg-sky-50 text-sky-700 ring-sky-200",
};

export function CustomerTable({
  customers,
  busyId,
  onView,
  onRoleChange,
}: {
  customers: AdminCustomer[];
  busyId: string | null;
  onView: (customer: AdminCustomer) => void;
  onRoleChange: (customer: AdminCustomer, role: AssignableRole) => void;
}) {
  const { t, locale } = useLocale();
  const th = "px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500";

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="border-b border-slate-200 bg-slate-50/60">
          <tr>
            <th className={th}>{t("dash.colCustomer")}</th>
            <th className={th}>{t("dash.colPhone")}</th>
            <th className={th}>{t("dash.colRole")}</th>
            <th className={th}>{t("dash.colRegistered")}</th>
            <th className={`${th} text-right`}>{t("dash.colActions")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {customers.map((customer) => (
            <tr
              key={customer.id}
              onClick={() => onView(customer)}
              className="cursor-pointer hover:bg-slate-50/60"
            >
              <td className="px-4 py-3">
                <p className="max-w-[220px] truncate font-medium text-slate-900">{customer.name}</p>
                <p className="max-w-[220px] truncate text-xs text-slate-500">{customer.email}</p>
              </td>
              <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-900">
                {customer.phone || "—"}
              </td>
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <select
                  value={customer.role}
                  disabled={busyId === customer.id}
                  aria-label={`${t("dash.colRole")}: ${customer.name}`}
                  onChange={(e) => {
                    const role = AssignableRoleSchema.parse(e.target.value);
                    if (role !== customer.role) onRoleChange(customer, role);
                  }}
                  className={cn(
                    "cursor-pointer rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50",
                    ROLE_STYLES[customer.role],
                  )}
                >
                  {AssignableRoleSchema.options.map((role) => (
                    <option key={role} value={role}>
                      {t(`dash.role${role}`)}
                    </option>
                  ))}
                </select>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                {formatDate(customer.createdAt, locale)}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  title={t("dash.view")}
                  aria-label={`${t("dash.view")}: ${customer.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(customer);
                  }}
                  className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
