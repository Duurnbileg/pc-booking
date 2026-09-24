import { Router } from "express";
import mongoose from "mongoose";
import {
  CreateCafeSchema,
  UpdateCafeSchema,
  slugify,
} from "@pc-booking/shared";
import { Cafe } from "../models/Cafe.js";
import { PC } from "../models/PC.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { serializeCafe, serializePc } from "../utils/serialize.js";

export const cafesRouter = Router();

async function uniqueSlug(base: string): Promise<string> {
  let slug = slugify(base) || "cafe";
  let n = 0;
  while (await Cafe.exists({ slug: n === 0 ? slug : `${slug}-${n}` })) {
    n += 1;
  }
  return n === 0 ? slug : `${slug}-${n}`;
}

cafesRouter.get("/", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const filter: Record<string, unknown> = { status: "APPROVED" };
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { address: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
    ];
  }

  const cafes = await Cafe.find(filter).sort({ createdAt: -1 }).lean();
  const cafeIds = cafes.map((c) => c._id);
  const counts = await PC.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
    { $match: { cafeId: { $in: cafeIds } } },
    { $group: { _id: "$cafeId", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));

  res.json({
    cafes: cafes.map((c) =>
      serializeCafe(c as never, countMap.get(c._id.toString()) ?? 0),
    ),
  });
});

cafesRouter.get("/:cafeId/pcs", async (req, res) => {
  const { cafeId } = req.params;
  const cafe = mongoose.isValidObjectId(cafeId)
    ? await Cafe.findById(cafeId)
    : await Cafe.findOne({ slug: cafeId });

  if (!cafe || cafe.status !== "APPROVED") {
    res.status(404).json({ error: "Cafe not found" });
    return;
  }

  const pcs = await PC.find({ cafeId: cafe._id }).sort({ name: 1 });
  res.json({ pcs: pcs.map(serializePc) });
});

cafesRouter.get("/:idOrSlug", async (req, res) => {
  const { idOrSlug } = req.params;
  const query = mongoose.isValidObjectId(idOrSlug)
    ? { $or: [{ _id: idOrSlug }, { slug: idOrSlug }] }
    : { slug: idOrSlug };

  const cafe = await Cafe.findOne(query);
  if (!cafe) {
    res.status(404).json({ error: "Cafe not found" });
    return;
  }

  // Public may only see APPROVED; owners/admins handled via auth header later — keep simple:
  // Allow PENDING/SUSPENDED only if requester is owner/admin (optionalAuth not wired here).
  // For Phase 1: public detail only for APPROVED.
  if (cafe.status !== "APPROVED") {
    res.status(404).json({ error: "Cafe not found" });
    return;
  }

  const pcCount = await PC.countDocuments({ cafeId: cafe._id });
  res.json({ cafe: serializeCafe(cafe, pcCount) });
});

cafesRouter.post(
  "/",
  requireAuth,
  requireRoles("CAFE_OWNER", "ADMIN"),
  async (req, res) => {
    const parsed = CreateCafeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      return;
    }

    const data = parsed.data;
    const slug = await uniqueSlug(data.name);
    const cafe = await Cafe.create({
      name: data.name,
      slug,
      description: data.description ?? "",
      address: data.address,
      phone: data.phone,
      images: data.images ?? [],
      openingHours: data.openingHours ?? defaultOpeningHours(),
      status: "PENDING",
      ownerId: req.user!.id,
      pricePerHour: data.pricePerHour,
      location: {
        type: "Point",
        coordinates: [
          data.location?.lng ?? 106.917,
          data.location?.lat ?? 47.918,
        ],
      },
    });

    if (data.pcs?.length) {
      await PC.insertMany(
        data.pcs.map((pc) => ({
          cafeId: cafe._id,
          name: pc.name,
          zone: pc.zone,
          status: pc.status ?? "AVAILABLE",
          specifications: pc.specifications,
          pricePerHour: pc.pricePerHour ?? data.pricePerHour,
        })),
      );
    }

    const pcCount = await PC.countDocuments({ cafeId: cafe._id });
    res.status(201).json({ cafe: serializeCafe(cafe, pcCount) });
  },
);

cafesRouter.patch(
  "/:id",
  requireAuth,
  requireRoles("CAFE_OWNER", "ADMIN"),
  async (req, res) => {
    const parsed = UpdateCafeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
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

    const data = parsed.data;
    if (data.name !== undefined) cafe.name = data.name;
    if (data.description !== undefined) cafe.description = data.description;
    if (data.address !== undefined) cafe.address = data.address;
    if (data.phone !== undefined) cafe.phone = data.phone;
    if (data.pricePerHour !== undefined) cafe.pricePerHour = data.pricePerHour;
    if (data.images !== undefined) cafe.images = data.images;
    if (data.openingHours !== undefined) cafe.openingHours = data.openingHours as never;
    if (data.location) {
      cafe.location = {
        type: "Point",
        coordinates: [data.location.lng, data.location.lat],
      };
    }

    await cafe.save();
    const pcCount = await PC.countDocuments({ cafeId: cafe._id });
    res.json({ cafe: serializeCafe(cafe, pcCount) });
  },
);

function defaultOpeningHours() {
  return Array.from({ length: 7 }, (_, day) => ({
    day,
    open: "10:00",
    close: "02:00",
    closed: false,
  }));
}
