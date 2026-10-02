"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { formatBookingRange } from "@/lib/booking";
import type { Booking } from "@/lib/types";
import { cn, formatMnt } from "@/lib/utils";
import { useLocale } from "@/components/locale-provider";

export function bookingIsUpcoming(booking: Booking, now = Date.now()): boolean {
  return booking.status === "CONFIRMED" && new Date(booking.endAt).getTime() > now;
}

export function BookingRow({ booking, action }: { booking: Booking; action?: ReactNode }) {
  const { t } = useLocale();
  const upcoming = bookingIsUpcoming(booking);
  const status =
    booking.status === "CANCELLED"
      ? { label: t("booking.statusCancelled"), tone: "text-status-reserved/80" }
      : upcoming
        ? { label: t("booking.statusConfirmed"), tone: "text-status-available/80" }
        : { label: t("booking.statusDone"), tone: "text-ink-500" };

  return (
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          {booking.cafe.slug ? (
            <Link
              href={`/cafes/${booking.cafe.slug}`}
              className="font-display text-lg text-ink-100 hover:text-accent"
            >
              {booking.cafe.name}
            </Link>
          ) : (
            <span className="font-display text-lg text-ink-100">{booking.cafe.name}</span>
          )}
          <span className={cn("text-xs font-medium", status.tone)}>{status.label}</span>
        </div>
        <p className="text-sm tabular-nums text-ink-300">
          {formatBookingRange(booking.startAt, booking.endAt)} ·{" "}
          {t("booking.hoursN", { n: booking.hours })}
        </p>
        <p className="text-sm text-ink-500">
          {booking.seats.map((s) => s.label).join(", ")} · {formatMnt(booking.totalPrice)}
        </p>
        {booking.customer ? (
          <p className="text-sm text-ink-300">
            {booking.customer.name}
            {booking.customer.phone ? ` · ${booking.customer.phone}` : ""}
            <span className="text-ink-500"> · {booking.customer.email}</span>
          </p>
        ) : null}
      </div>
      {action}
    </li>
  );
}
