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
import { serializeCafe } from "../utils/serialize.js";

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

  const cafes = await Cafe.find(filter).sort({ createdAt: -1 });
  res.json({
    cafes: cafes.map((c) => serializeCafe(c)),
  });
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

  if (cafe.status !== "APPROVED") {
    res.status(404).json({ error: "Cafe not found" });
    return;
  }

  res.json({ cafe: serializeCafe(cafe) });
});

cafesRouter.post(
  "/",
  requireAuth,
  requireRoles("CAFE_OWNER", "ADMIN"),
  async (req, res) => {
    const parsed = CreateCafeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      });
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
      gear: data.gear ?? "",
      displaySpecs: data.displaySpecs ?? "",
      totalPcs: data.pcCount ?? 0,
      openingHours: data.openingHours ?? defaultOpeningHours(),
      status: req.user!.role === "ADMIN" ? "APPROVED" : "PENDING",
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

    res.status(201).json({ cafe: serializeCafe(cafe) });
  },
);

cafesRouter.patch(
  "/:id",
  requireAuth,
  requireRoles("CAFE_OWNER", "ADMIN"),
  async (req, res) => {
    const parsed = UpdateCafeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      });
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
    if (data.gear !== undefined) cafe.gear = data.gear;
    if (data.displaySpecs !== undefined) cafe.displaySpecs = data.displaySpecs;
    if (data.pcCount !== undefined) cafe.totalPcs = data.pcCount;
    if (data.openingHours !== undefined) {
      cafe.openingHours = data.openingHours as never;
    }
    if (data.location) {
      cafe.location = {
        type: "Point",
        coordinates: [data.location.lng, data.location.lat],
      };
    }

    await cafe.save();
    res.json({ cafe: serializeCafe(cafe) });
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
