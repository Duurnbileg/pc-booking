"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_PATHS } from "@pc-booking/shared";
import { api } from "@/lib/api";
import type { Booking } from "@/lib/types";
import { useAuth } from "@/components/auth-provider";
import { useLocale } from "@/components/locale-provider";
import { BookingRow, bookingIsUpcoming } from "@/components/booking-row";
import { ListRowsSkeleton, PageSkeleton } from "@/components/skeletons";

export default function MyBookingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useLocale();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${encodeURIComponent("/bookings")}`);
  }, [user, loading, router]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["my-bookings"],
    enabled: Boolean(user),
    queryFn: () => api<{ bookings: Booking[] }>(API_PATHS.bookings.mine),
  });

  const cancel = useMutation({
    mutationFn: (id: string) =>
      api<{ booking: Booking }>(API_PATHS.bookings.cancel(id), { method: "PATCH" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      void queryClient.invalidateQueries({ queryKey: ["booked-seats"] });
    },
  });

  if (loading || !user) return <PageSkeleton />;

  const bookings = data?.bookings ?? [];
  const upcoming = bookings
    .filter((b) => bookingIsUpcoming(b))
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
  const past = bookings.filter((b) => !bookingIsUpcoming(b));

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl">{t("booking.myTitle")}</h1>

      {isLoading ? (
        <ListRowsSkeleton rows={3} />
      ) : error ? (
        <p className="text-status-reserved">{t("booking.loadFailed")}</p>
      ) : !bookings.length ? (
        <div className="space-y-3">
          <p className="text-ink-500">{t("booking.empty")}</p>
          <Link href="/" className="text-sm font-medium text-accent hover:underline">
            {t("booking.findCenter")}
          </Link>
        </div>
      ) : (
        <>
          {cancel.isError ? (
            <p className="text-sm text-status-reserved">{t("booking.cancelFailed")}</p>
          ) : null}
          {[
            { title: t("booking.upcoming"), items: upcoming },
            { title: t("booking.past"), items: past },
          ]
            .filter((group) => group.items.length)
            .map((group) => (
              <section key={group.title} className="space-y-2">
                <h2 className="font-display text-xl text-ink-100">{group.title}</h2>
                <ul className="divide-y divide-ink-800 border-y border-ink-800">
                  {group.items.map((booking) => (
                    <BookingRow
                      key={booking.id}
                      booking={booking}
                      action={
                        booking.status === "CONFIRMED" &&
                        new Date(booking.startAt).getTime() > Date.now() ? (
                          <button
                            type="button"
                            disabled={cancel.isPending}
                            onClick={() => {
                              if (window.confirm(t("booking.cancelConfirm"))) cancel.mutate(booking.id);
                            }}
                            className="self-start rounded-lg border border-status-reserved/40 px-3 py-1.5 text-sm text-status-reserved transition hover:bg-status-reserved/10 disabled:opacity-50 sm:self-center"
                          >
                            {t("booking.cancelBooking")}
                          </button>
                        ) : null
                      }
                    />
                  ))}
                </ul>
              </section>
            ))}
        </>
      )}
    </div>
  );
}
