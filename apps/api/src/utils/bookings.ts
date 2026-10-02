import type mongoose from "mongoose";
import { Booking, type BookingDocument } from "../models/Booking.js";

export const MAX_DAYS_AHEAD = 30;
const HOUR_MS = 60 * 60 * 1000;

export function bookingEndAt(startAt: Date, hours: number): Date {
  return new Date(startAt.getTime() + hours * HOUR_MS);
}

/** Confirmed bookings at the cafe whose time range intersects [startAt, endAt). */
export function overlappingBookings(
  cafeId: mongoose.Types.ObjectId,
  startAt: Date,
  endAt: Date,
  seatIds?: string[],
) {
  return Booking.find({
    cafeId,
    status: "CONFIRMED",
    startAt: { $lt: endAt },
    endAt: { $gt: startAt },
    ...(seatIds ? { "seats.seatId": { $in: seatIds } } : {}),
  });
}

type CafeRef = { _id: mongoose.Types.ObjectId; name: string; slug: string };
type UserRef = { name: string; phone?: string | null; email: string };

export function serializeBooking(booking: BookingDocument, cafe?: CafeRef | null, user?: UserRef | null) {
  return {
    id: booking._id.toString(),
    cafe: cafe
      ? { id: cafe._id.toString(), name: cafe.name, slug: cafe.slug }
      : { id: booking.cafeId.toString(), name: "", slug: "" },
    seats: booking.seats.map((s) => ({ id: s.seatId, label: s.label, zone: s.zone })),
    startAt: booking.startAt,
    endAt: booking.endAt,
    hours: booking.hours,
    totalPrice: booking.totalPrice,
    status: booking.status,
    createdAt: booking.createdAt,
    ...(user ? { customer: { name: user.name, phone: user.phone ?? null, email: user.email } } : {}),
  };
}
