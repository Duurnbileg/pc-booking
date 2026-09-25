import { Router } from "express";
import mongoose from "mongoose";
import { Cafe } from "../models/Cafe.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { serializeCafe } from "../utils/serialize.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRoles("ADMIN"));

adminRouter.get("/cafes/pending", async (_req, res) => {
  const cafes = await Cafe.find({ status: "PENDING" }).sort({ createdAt: -1 });
  res.json({
    cafes: cafes.map((c) => serializeCafe(c)),
  });
});

adminRouter.get("/cafes", async (_req, res) => {
  const cafes = await Cafe.find().sort({ name: 1 });
  res.json({
    cafes: cafes.map((c) => serializeCafe(c)),
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
  res.json({ cafe: serializeCafe(cafe) });
});

/** Reject a pending cafe by deleting it. */
adminRouter.post("/cafes/:id/reject", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ error: "Invalid cafe id" });
    return;
  }

  const cafe = await Cafe.findById(req.params.id);
  if (!cafe) {
    res.status(404).json({ error: "Cafe not found" });
    return;
  }
  if (cafe.status !== "PENDING") {
    res.status(400).json({ error: "Only pending cafes can be rejected" });
    return;
  }

  await cafe.deleteOne();
  res.json({ ok: true });
});

adminRouter.post("/cafes/:id/suspend", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ error: "Invalid cafe id" });
    return;
  }

  const cafe = await Cafe.findById(req.params.id);
  if (!cafe) {
    res.status(404).json({ error: "Cafe not found" });
    return;
  }

  cafe.status = "SUSPENDED";
  await cafe.save();
  res.json({ cafe: serializeCafe(cafe) });
});
