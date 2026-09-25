"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { API_PATHS } from "@pc-booking/shared";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import type { Cafe } from "@/lib/types";
import { formatMnt } from "@/lib/utils";
import { useT } from "@/components/locale-provider";

export default function OwnerCafesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const t = useT();

  useEffect(() => {
    if (!loading && (!user || (user.role !== "CAFE_OWNER" && user.role !== "ADMIN"))) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["owner-cafes"],
    enabled: Boolean(user && (user.role === "CAFE_OWNER" || user.role === "ADMIN")),
    queryFn: () => api<{ cafes: Cafe[] }>(API_PATHS.owner.myCafes),
  });

  if (loading || !user) {
    return <p className="text-ink-500">{t("owner.loading")}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl">{t("owner.title")}</h1>
        <Link
          href="/owner/cafes/new"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-ink-950 hover:bg-accent-dim"
        >
          {t("owner.addCafe")}
        </Link>
      </div>

      {isLoading ? (
        <p className="text-ink-500">{t("owner.loading")}</p>
      ) : error ? (
        <p className="text-status-reserved">{t("owner.loadFailed")}</p>
      ) : !data?.cafes.length ? (
        <p className="text-ink-500">{t("owner.empty")}</p>
      ) : (
        <ul className="divide-y divide-ink-800 border-y border-ink-800">
          {data.cafes.map((cafe) => (
            <li
              key={cafe.id}
              className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <Link
                  href={`/owner/cafes/${cafe.id}`}
                  className="font-display text-lg hover:text-accent"
                >
                  {cafe.name}
                </Link>
                <p className="text-sm text-ink-500">
                  {cafe.status} · {t("home.pcs", { n: cafe.pcCount ?? 0 })} ·{" "}
                  {formatMnt(cafe.pricePerHour)}
                  {t("home.perHour")}
                </p>
              </div>
              <Link
                href={`/owner/cafes/${cafe.id}`}
                className="text-sm text-ink-300 hover:text-ink-100"
              >
                {t("owner.manage")}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
