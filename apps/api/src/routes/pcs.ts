import { Router } from "express";
import mongoose from "mongoose";
import { PC } from "../models/PC.js";
import { Cafe } from "../models/Cafe.js";
import { serializePc } from "../utils/serialize.js";

export const pcsRouter = Router();

pcsRouter.get("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ error: "Invalid PC id" });
    return;
  }

  const pc = await PC.findById(req.params.id);
  if (!pc) {
    res.status(404).json({ error: "PC not found" });
    return;
  }

  const cafe = await Cafe.findById(pc.cafeId);
  if (!cafe || cafe.status !== "APPROVED") {
    res.status(404).json({ error: "PC not found" });
    return;
  }

  res.json({ pc: serializePc(pc) });
});
