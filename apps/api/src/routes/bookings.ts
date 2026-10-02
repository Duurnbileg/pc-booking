import { Router } from "express";
import mongoose from "mongoose";
import { CreateBookingSchema, bookingStartAt } from "@pc-booking/shared";
import { Booking } from "../models/Booking.js";
import { Cafe } from "../models/Cafe.js";
import { requireAuth } from "../middleware/auth.js";
import { serializePricing } from "../utils/serialize.js";
import {
  MAX_DAYS_AHEAD,
  bookingEndAt,
  overlappingBookings,
  serializeBooking,
} from "../utils/bookings.js";
import { findApprovedCafe } from "./cafes.js";

export const bookingsRouter = Router();

bookingsRouter.use(requireAuth);

bookingsRouter.post("/", async (req, res) => {
  const parsed = CreateBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const data = parsed.data;

  const cafe = await findApprovedCafe(data.cafe);
  if (!cafe) {
    res.status(404).json({ error: "Cafe not found" });
    return;
  }

  const seatIds = data.seats.map((s) => s.id);
  if (new Set(seatIds).size !== seatIds.length) {
    res.status(400).json({ error: "Duplicate seats" });
    return;
  }

  const startAt = bookingStartAt(data);
  const now = Date.now();
  if (Number.isNaN(startAt.getTime()) || startAt.getTime() <= now) {
    res.status(400).json({ error: "Start time must be in the future" });
    return;
  }
  if (startAt.getTime() > now + MAX_DAYS_AHEAD * 24 * 60 * 60 * 1000) {
    res.status(400).json({ error: `Bookings open at most ${MAX_DAYS_AHEAD} days ahead` });
    return;
  }
  const endAt = bookingEndAt(startAt, data.hours);

  const pricing = serializePricing(cafe);
  if (data.seats.some((s) => s.zone === "vip") && !pricing.vip) {
    res.status(400).json({ error: "This gaming center has no VIP zone" });
    return;
  }
  const hourlyTotal = data.seats.reduce(
    (sum, s) => sum + (s.zone === "vip" ? pricing.vip!.price : pricing.hall.price),
    0,
  );

  const conflicts = await overlappingBookings(cafe._id, startAt, endAt, seatIds);
  if (conflicts.length) {
    const taken = new Set(conflicts.flatMap((b) => b.seats.map((s) => s.seatId)));
    res.status(409).json({
      error: "Some seats are already booked for this time",
      seats: data.seats.filter((s) => taken.has(s.id)).map((s) => s.label),
    });
    return;
  }

  const booking = await Booking.create({
    userId: req.user!.id,
    cafeId: cafe._id,
    seats: data.seats.map((s) => ({ seatId: s.id, label: s.label, zone: s.zone })),
    startAt,
    endAt,
    hours: data.hours,
    totalPrice: hourlyTotal * data.hours,
  });

  res.status(201).json({ booking: serializeBooking(booking, cafe) });
});

bookingsRouter.get("/me", async (req, res) => {
  const bookings = await Booking.find({ userId: req.user!.id }).sort({ startAt: -1 }).limit(100);
  const cafes = await Cafe.find(
    { _id: { $in: [...new Set(bookings.map((b) => b.cafeId.toString()))] } },
    { name: 1, slug: 1 },
  );
  const byId = new Map(cafes.map((c) => [c._id.toString(), c]));
  res.json({
    bookings: bookings.map((b) => serializeBooking(b, byId.get(b.cafeId.toString()))),
  });
});

bookingsRouter.patch("/:id/cancel", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ error: "Invalid booking id" });
    return;
  }
  const booking = await Booking.findById(req.params.id);
  if (!booking || booking.userId.toString() !== req.user!.id) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }
  if (booking.status !== "CONFIRMED" || booking.startAt.getTime() <= Date.now()) {
    res.status(400).json({ error: "Only upcoming bookings can be cancelled" });
    return;
  }
  booking.status = "CANCELLED";
  await booking.save();
  const cafe = await Cafe.findById(booking.cafeId, { name: 1, slug: 1 });
  res.json({ booking: serializeBooking(booking, cafe) });
});
