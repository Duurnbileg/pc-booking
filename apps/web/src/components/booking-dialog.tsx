"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, X } from "lucide-react";
import { API_PATHS, bookingStartAt, type BookingSlot, type SeatZone } from "@pc-booking/shared";
import { api, ApiError } from "@/lib/api";
import { formatBookingRange, zonePrice } from "@/lib/booking";
import type { Seat } from "@/lib/mock-seats";
import type { Booking, Cafe } from "@/lib/types";
import { formatMnt } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";
import { useLocale } from "@/components/locale-provider";

const ZONE_ORDER: SeatZone[] = ["hall", "vip"];

export function BookingDialog({
  cafe,
  slot,
  seats,
  onClose,
  onBooked,
  onConflict,
}: {
  cafe: Cafe;
  slot: BookingSlot;
  seats: Seat[];
  onClose: () => void;
  onBooked: () => void;
  onConflict: () => void;
}) {
  const { t } = useLocale();
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const startAt = bookingStartAt(slot);
  const endAt = new Date(startAt.getTime() + slot.hours * 60 * 60 * 1000);
  const zoneLines = ZONE_ORDER.map((zone) => ({
    zone,
    count: seats.filter((s) => s.zone === zone).length,
    price: zonePrice(cafe, zone),
  })).filter((line) => line.count);
  const total = zoneLines.reduce((sum, line) => sum + line.count * line.price, 0) * slot.hours;

  const mutation = useMutation({
    mutationFn: () =>
      api<{ booking: Booking }>(API_PATHS.bookings.create, {
        method: "POST",
        body: JSON.stringify({
          cafe: cafe.slug,
          ...slot,
          seats: seats.map(({ id, label, zone }) => ({ id, label, zone })),
        }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      onBooked();
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 409) {
        setError(t("booking.conflict"));
        onConflict();
      } else {
        setError(err instanceof ApiError ? err.message : t("booking.failed"));
      }
    },
  });
  const booking = mutation.data?.booking;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !mutation.isPending) onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mutation.isPending, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/75 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !mutation.isPending) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-dialog-title"
        className="w-full max-w-md space-y-5 rounded-2xl border border-ink-800 bg-ink-900 p-6 shadow-[0_24px_64px_rgba(0,0,0,0.5)]"
      >
        {booking ? (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-status-available" />
            <div className="space-y-1">
              <h2 id="booking-dialog-title" className="font-display text-xl text-ink-100">
                {t("booking.success")}
              </h2>
              <p className="text-sm text-ink-300">
                {booking.cafe.name} · {formatBookingRange(booking.startAt, booking.endAt)}
              </p>
              <p className="text-sm text-ink-500">
                {booking.seats.map((s) => s.label).join(", ")} · {formatMnt(booking.totalPrice)}
              </p>
            </div>
            <p className="text-xs text-ink-500">{t("booking.successHint")}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-ink-700 py-2.5 text-sm font-medium text-ink-100 transition hover:border-ink-500"
              >
                {t("booking.close")}
              </button>
              <Link
                href="/bookings"
                className="flex-1 rounded-xl bg-accent py-2.5 text-center text-sm font-semibold text-ink-950 transition hover:bg-accent-dim"
              >
                {t("booking.viewMine")}
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="booking-dialog-title" className="font-display text-xl text-ink-100">
                  {t("booking.confirmTitle")}
                </h2>
                <p className="text-sm text-ink-500">{cafe.name}</p>
              </div>
              <button
                type="button"
                aria-label={t("booking.close")}
                onClick={onClose}
                disabled={mutation.isPending}
                className="rounded-lg p-1 text-ink-500 transition hover:text-ink-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <dl className="space-y-3 rounded-xl border border-ink-800 bg-ink-950/40 p-4 text-sm">
              <SummaryRow label={t("booking.when")}>
                {formatBookingRange(startAt, endAt)} ({t("booking.hoursN", { n: slot.hours })})
              </SummaryRow>
              <SummaryRow label={t("booking.seats")}>
                {seats.map((s) => s.label).join(", ")}
              </SummaryRow>
              <div className="space-y-1 border-t border-ink-800 pt-3 text-ink-500">
                {zoneLines.map((line) => (
                  <p key={line.zone}>
                    {t("booking.zoneLine", {
                      zone: t(line.zone === "vip" ? "seat.vip" : "seat.hall"),
                      n: line.count,
                      price: formatMnt(line.price),
                    })}
                  </p>
                ))}
              </div>
              <div className="flex items-baseline justify-between border-t border-ink-800 pt-3">
                <dt className="text-ink-300">{t("booking.total")}</dt>
                <dd className="font-display text-xl font-semibold text-ink-100">{formatMnt(total)}</dd>
              </div>
            </dl>
            <p className="text-xs text-ink-500">{t("booking.payAtVenue")}</p>

            {error ? <p className="text-sm text-status-reserved">{error}</p> : null}

            {!loading && !user ? (
              <div className="space-y-2">
                <p className="text-sm text-ink-300">{t("booking.loginRequired")}</p>
                <Link
                  href={`/login?next=${encodeURIComponent(`/cafes/${cafe.slug}`)}`}
                  className="block rounded-xl bg-accent py-3 text-center text-sm font-semibold text-ink-950 transition hover:bg-accent-dim"
                >
                  {t("booking.loginToBook")}
                </Link>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={mutation.isPending}
                  className="flex-1 rounded-xl border border-ink-700 py-3 text-sm font-medium text-ink-100 transition hover:border-ink-500"
                >
                  {t("booking.back")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    mutation.mutate();
                  }}
                  disabled={mutation.isPending || loading || !seats.length}
                  className="flex-[2] rounded-xl bg-accent py-3 text-sm font-semibold text-ink-950 transition hover:bg-accent-dim disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {mutation.isPending ? t("booking.confirming") : t("booking.confirm")}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-ink-500">{label}</dt>
      <dd className="text-right text-ink-100">{children}</dd>
    </div>
  );
}
