import { Router } from "express";
import mongoose from "mongoose";
import { Cafe } from "../models/Cafe.js";
import { PC } from "../models/PC.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { serializeCafe } from "../utils/serialize.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRoles("ADMIN"));

adminRouter.get("/cafes/pending", async (_req, res) => {
  const cafes = await Cafe.find({ status: "PENDING" }).sort({ createdAt: -1 });
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

adminRouter.post("/cafes/:id/approve", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ error: "Invalid cafe id" });
    return;
  }

  const cafe = await Cafe.findById(req.params.id);
  if (!cafe) {
    res.status(404).json({ error: "Cafe not found" });
    return;
  }

  cafe.status = "APPROVED";
  await cafe.save();
  const pcCount = await PC.countDocuments({ cafeId: cafe._id });
  res.json({ cafe: serializeCafe(cafe, pcCount) });
});
