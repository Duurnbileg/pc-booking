import { Router } from "express";
import mongoose from "mongoose";
import { Booking } from "../models/Booking.js";
import { Cafe } from "../models/Cafe.js";
import { User } from "../models/User.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { serializeCafe } from "../utils/serialize.js";
import { serializeBooking } from "../utils/bookings.js";

export const ownerRouter = Router();

ownerRouter.use(requireAuth, requireRoles("CAFE_OWNER", "ADMIN"));

ownerRouter.get("/cafes", async (req, res) => {
  const filter =
    req.user!.role === "ADMIN" ? {} : { ownerId: req.user!.id };
  const cafes = await Cafe.find(filter).sort({ createdAt: -1 });
  res.json({
    cafes: cafes.map((c) => serializeCafe(c)),
  });
});

ownerRouter.get("/bookings", async (req, res) => {
  const cafeFilter = req.user!.role === "ADMIN" ? {} : { ownerId: req.user!.id };
  const cafes = await Cafe.find(cafeFilter, { name: 1, slug: 1 });
  const bookings = await Booking.find({
    cafeId: { $in: cafes.map((c) => c._id) },
    status: "CONFIRMED",
    endAt: { $gt: new Date() },
  })
    .sort({ startAt: 1 })
    .limit(200);
  const users = await User.find(
    { _id: { $in: [...new Set(bookings.map((b) => b.userId.toString()))] } },
    { name: 1, phone: 1, email: 1 },
  );
  const cafesById = new Map(cafes.map((c) => [c._id.toString(), c]));
  const usersById = new Map(users.map((u) => [u._id.toString(), u]));
  res.json({
    bookings: bookings.map((b) =>
      serializeBooking(b, cafesById.get(b.cafeId.toString()), usersById.get(b.userId.toString())),
    ),
  });
});

ownerRouter.get("/cafes/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ error: "Invalid cafe id" });
    return;
  }

  const cafe = await Cafe.findById(req.params.id);
  if (!cafe) {
    res.status(404).json({ error: "Cafe not found" });
    return;
  }

  if (
    req.user!.role !== "ADMIN" &&
    cafe.ownerId.toString() !== req.user!.id
  ) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  res.json({
    cafe: serializeCafe(cafe),
  });
});
