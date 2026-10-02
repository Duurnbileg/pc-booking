import { bookingStartAt, type BookingSlot, type SeatZone } from "@pc-booking/shared";
import type { Cafe } from "@/lib/types";
import { todayIso } from "@/lib/search";

export const MAX_DAYS_AHEAD = 30;
const SOON_MS = 60 * 60 * 1000;
const UB_TIME_ZONE = "Asia/Ulaanbaatar";

const pad = (n: number) => String(n).padStart(2, "0");

export const TIME_OPTIONS = Array.from(
  { length: 48 },
  (_, i) => `${pad(Math.floor(i / 2))}:${i % 2 ? "30" : "00"}`,
);

export function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Start times on `date` that are still in the future. */
export function availableTimes(date: string, now = Date.now()): string[] {
  return TIME_OPTIONS.filter((startTime) => bookingStartAt({ date, startTime }).getTime() > now);
}

/** Today at the next full hour, or tomorrow morning once today's slots have passed. */
export function defaultSlot(): BookingSlot {
  let date = todayIso();
  let times = availableTimes(date);
  if (!times.length) {
    date = addDays(date, 1);
    times = TIME_OPTIONS;
  }
  return { date, startTime: times.find((time) => time.endsWith(":00")) ?? times[0]!, hours: 1 };
}

/** Mock "in use" seats only matter for slots that start before current sessions could end. */
export function slotStartsSoon(slot: BookingSlot, now = Date.now()): boolean {
  return bookingStartAt(slot).getTime() - now < SOON_MS;
}

export function slotQuery(slot: BookingSlot): string {
  return new URLSearchParams({
    date: slot.date,
    startTime: slot.startTime,
    hours: String(slot.hours),
  }).toString();
}

export function zonePrice(cafe: Cafe, zone: SeatZone): number {
  return zone === "vip" ? (cafe.pricing.vip?.price ?? cafe.pricing.hall.price) : cafe.pricing.hall.price;
}

export function formatBookingRange(startAt: string | Date, endAt: string | Date): string {
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: UB_TIME_ZONE }).format(new Date(startAt));
  const time = (value: string | Date) =>
    new Intl.DateTimeFormat("en-GB", {
      timeZone: UB_TIME_ZONE,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(value));
  return `${date.replaceAll("-", ".")} · ${time(startAt)}–${time(endAt)}`;
}
