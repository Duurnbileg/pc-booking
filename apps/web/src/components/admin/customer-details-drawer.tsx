"use client";

import { useLocale } from "@/components/locale-provider";
import { Drawer } from "@/components/admin/drawer";
import { DetailRow, DetailSection } from "@/components/admin/pc-details-drawer";
import { formatDate } from "@/components/admin/format";
import type { AdminCustomer } from "@/lib/types";

export function CustomerDetailsDrawer({
  customer,
  onClose,
}: {
  customer: AdminCustomer | null;
  onClose: () => void;
}) {
  const { t, locale } = useLocale();

  return (
    <Drawer
      open={Boolean(customer)}
      title={customer?.name ?? t("dash.customerDetails")}
      onClose={onClose}
    >
      {customer ? (
        <DetailSection title={t("dash.customerDetails")}>
          <DetailRow label={t("dash.phone")} value={customer.phone} />
          <DetailRow label={t("dash.email")} value={customer.email} />
          <DetailRow label={t("dash.registered")} value={formatDate(customer.createdAt, locale, true)} />
          <DetailRow
            label={t("dash.lastLogin")}
            value={customer.lastLoginAt ? formatDate(customer.lastLoginAt, locale, true) : t("dash.never")}
          />
        </DetailSection>
      ) : null}
    </Drawer>
  );
}
