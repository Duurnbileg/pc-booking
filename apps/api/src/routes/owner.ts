import { Router } from "express";
import mongoose from "mongoose";
import { Cafe } from "../models/Cafe.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { serializeCafe } from "../utils/serialize.js";

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
