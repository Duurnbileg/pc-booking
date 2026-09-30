"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { API_PATHS, type CafeStatus } from "@pc-booking/shared";
import { api } from "@/lib/api";
import type { AdminCafe, AdminCustomer, AdminStats, Paginated } from "@/lib/types";

export const ADMIN_KEYS = {
  stats: ["admin-stats"] as const,
  cafes: ["admin-cafes"] as const,
  customers: ["admin-customers"] as const,
};

export function useAdminStats() {
  return useQuery({
    queryKey: ADMIN_KEYS.stats,
    queryFn: () => api<AdminStats>(API_PATHS.admin.stats),
  });
}

export type AdminCafeQuery = {
  status?: CafeStatus;
  search?: string;
  page?: number;
  limit?: number;
};

export function useAdminCafes({ status, search, page = 1, limit = 20 }: AdminCafeQuery) {
  return useQuery({
    queryKey: [...ADMIN_KEYS.cafes, { status, search, page, limit }],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (status) params.set("status", status);
      if (search) params.set("search", search);
      return api<Paginated<"cafes", AdminCafe>>(`${API_PATHS.admin.cafes}?${params}`);
    },
    placeholderData: keepPreviousData,
  });
}

export function useAdminCustomers({ phone, page = 1 }: { phone?: string; page?: number }) {
  return useQuery({
    queryKey: [...ADMIN_KEYS.customers, { phone, page }],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (phone) params.set("phone", phone);
      return api<Paginated<"customers", AdminCustomer>>(
        `${API_PATHS.admin.customers}?${params}`,
      );
    },
    placeholderData: keepPreviousData,
  });
}
