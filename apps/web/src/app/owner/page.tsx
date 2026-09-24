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

export default function OwnerCafesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

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
    return <p className="text-ink-500">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl">My cafes</h1>
        <Link
          href="/owner/cafes/new"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-ink-950 hover:bg-accent-dim"
        >
          Add cafe
        </Link>
      </div>

      {isLoading ? (
        <p className="text-ink-500">Loading…</p>
      ) : error ? (
        <p className="text-status-reserved">Failed to load cafes.</p>
      ) : !data?.cafes.length ? (
        <p className="text-ink-500">No cafes yet. Create your first gaming center.</p>
      ) : (
        <ul className="divide-y divide-ink-800 border-y border-ink-800">
          {data.cafes.map((cafe) => (
            <li key={cafe.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <Link
                  href={`/owner/cafes/${cafe.id}`}
                  className="font-display text-lg hover:text-accent"
                >
                  {cafe.name}
                </Link>
                <p className="text-sm text-ink-500">
                  {cafe.status} · {cafe.pcCount ?? 0} PCs · {formatMnt(cafe.pricePerHour)}/hr
                </p>
              </div>
              <Link
                href={`/owner/cafes/${cafe.id}`}
                className="text-sm text-ink-300 hover:text-ink-100"
              >
                Manage →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
