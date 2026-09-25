"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { API_PATHS } from "@pc-booking/shared";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import type { Cafe } from "@/lib/types";
import { formatMnt } from "@/lib/utils";
import { useT } from "@/components/locale-provider";

export default function AdminPendingCafesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useT();
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-pending"],
    enabled: user?.role === "ADMIN",
    queryFn: () => api<{ cafes: Cafe[] }>(API_PATHS.admin.pendingCafes),
  });

  async function approve(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await api(API_PATHS.admin.approveCafe(id), { method: "POST" });
      await queryClient.invalidateQueries({ queryKey: ["admin-pending"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-cafes"] });
      await queryClient.invalidateQueries({ queryKey: ["cafes"] });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("admin.approveFailed"));
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    if (!confirm(t("admin.rejectConfirm"))) return;
    setBusyId(id);
    setError(null);
    try {
      await api(API_PATHS.admin.rejectCafe(id), { method: "POST" });
      await queryClient.invalidateQueries({ queryKey: ["admin-pending"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-cafes"] });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("admin.rejectFailed"));
    } finally {
      setBusyId(null);
    }
  }

  if (loading || !user) {
    return <p className="text-ink-500">{t("admin.loading")}</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">{t("admin.pendingTitle")}</h1>
      <p className="text-sm text-ink-500">{t("admin.pendingHint")}</p>
      {error ? <p className="text-sm text-status-reserved">{error}</p> : null}
      {isLoading ? (
        <p className="text-ink-500">{t("admin.loading")}</p>
      ) : !data?.cafes.length ? (
        <p className="text-ink-500">{t("admin.pendingEmpty")}</p>
      ) : (
        <ul className="divide-y divide-ink-800 border-y border-ink-800">
          {data.cafes.map((cafe) => (
            <li
              key={cafe.id}
              className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <p className="font-display text-lg">{cafe.name}</p>
                <p className="text-sm text-ink-500">
                  {cafe.address} · {t("home.pcs", { n: cafe.pcCount ?? 0 })} ·{" "}
                  {formatMnt(cafe.pricePerHour)}
                  {t("home.perHour")}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busyId === cafe.id}
                  onClick={() => void reject(cafe.id)}
                  className="rounded-lg border border-status-reserved/50 px-4 py-2 text-sm text-status-reserved hover:bg-status-reserved/10 disabled:opacity-60"
                >
                  {t("admin.reject")}
                </button>
                <button
                  type="button"
                  disabled={busyId === cafe.id}
                  onClick={() => void approve(cafe.id)}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-ink-950 hover:bg-accent-dim disabled:opacity-60"
                >
                  {busyId === cafe.id ? "…" : t("admin.approve")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
