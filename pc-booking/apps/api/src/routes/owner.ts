import { Router } from "express";
import mongoose from "mongoose";
import { Cafe } from "../models/Cafe.js";
import { PC } from "../models/PC.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { serializeCafe, serializePc } from "../utils/serialize.js";

export const ownerRouter = Router();

ownerRouter.use(requireAuth, requireRoles("CAFE_OWNER", "ADMIN"));

ownerRouter.get("/cafes", async (req, res) => {
  const filter =
    req.user!.role === "ADMIN" ? {} : { ownerId: req.user!.id };
  const cafes = await Cafe.find(filter).sort({ createdAt: -1 });
  const cafeIds = cafes.map((c) => c._id);
  const counts = await PC.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
    { $match: { cafeId: { $in: cafeIds } } },
    { $group: { _id: "$cafeId", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));

  res.json({
    cafes: cafes.map((c) => serializeCafe(c, countMap.get(c._id.toString()) ?? 0)),
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

  const pcs = await PC.find({ cafeId: cafe._id }).sort({ name: 1 });
  res.json({
    cafe: serializeCafe(cafe, pcs.length),
    pcs: pcs.map(serializePc),
  });
});
