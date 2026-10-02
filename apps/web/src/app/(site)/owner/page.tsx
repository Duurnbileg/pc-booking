"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { API_PATHS } from "@pc-booking/shared";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import type { Booking, Cafe } from "@/lib/types";
import { formatMnt } from "@/lib/utils";
import { useT } from "@/components/locale-provider";
import { BookingRow } from "@/components/booking-row";
import { ListRowsSkeleton, PageSkeleton } from "@/components/skeletons";

export default function OwnerCafesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const t = useT();

  const [justCreated, setJustCreated] = useState(false);

  useEffect(() => {
    if (!loading && (!user || (user.role !== "CAFE_OWNER" && user.role !== "ADMIN"))) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("created") === "1") {
      setJustCreated(true);
      router.replace("/owner", { scroll: false });
    }
  }, [router]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["owner-cafes"],
    enabled: Boolean(user && (user.role === "CAFE_OWNER" || user.role === "ADMIN")),
    queryFn: () => api<{ cafes: Cafe[] }>(API_PATHS.owner.myCafes),
  });

  const bookingsQuery = useQuery({
    queryKey: ["owner-bookings"],
    enabled: Boolean(user && (user.role === "CAFE_OWNER" || user.role === "ADMIN")),
    queryFn: () => api<{ bookings: Booking[] }>(API_PATHS.owner.bookings),
  });

  if (loading || !user) {
    return <PageSkeleton />;
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

      {justCreated ? (
        <p className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-ink-100">
          {t("owner.createdNotice")}
        </p>
      ) : null}

      {isLoading ? (
        <ListRowsSkeleton rows={3} />
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
                  {t(`dash.status${cafe.status}`)} · {t("home.pcs", { n: cafe.pcCount ?? 0 })} ·{" "}
                  {formatMnt(cafe.pricePerHour)}
                  {t("home.perHour")}
                </p>
                {cafe.status === "PENDING" ? (
                  <p className="mt-1 text-sm text-accent">{t("owner.pendingHint")}</p>
                ) : null}
                {cafe.status === "REJECTED" && cafe.rejectionReason ? (
                  <p className="mt-1 text-sm text-status-reserved">
                    {t("owner.rejectionReason")} {cafe.rejectionReason}
                  </p>
                ) : null}
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

      <section className="space-y-2">
        <h2 className="font-display text-2xl">{t("booking.ownerTitle")}</h2>
        {bookingsQuery.isLoading ? (
          <ListRowsSkeleton rows={2} />
        ) : bookingsQuery.error ? (
          <p className="text-status-reserved">{t("booking.loadFailed")}</p>
        ) : !bookingsQuery.data?.bookings.length ? (
          <p className="text-ink-500">{t("booking.ownerEmpty")}</p>
        ) : (
          <ul className="divide-y divide-ink-800 border-y border-ink-800">
            {bookingsQuery.data.bookings.map((booking) => (
              <BookingRow key={booking.id} booking={booking} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
