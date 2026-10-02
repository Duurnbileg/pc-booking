import { Router } from "express";
import mongoose from "mongoose";
import {
  BookingSlotSchema,
  CreateCafeSchema,
  DistrictSchema,
  UpdateCafeSchema,
  bookingStartAt,
  pricingSummary,
  slugify,
  type CafePricing,
  type CafeSort,
} from "@pc-booking/shared";
import { Cafe, type CafeDocument } from "../models/Cafe.js";
import { PC } from "../models/PC.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { serializeCafe, serializePc } from "../utils/serialize.js";
import { bookingEndAt, overlappingBookings } from "../utils/bookings.js";

export const cafesRouter = Router();

async function uniqueSlug(base: string): Promise<string> {
  let slug = slugify(base) || "cafe";
  let n = 0;
  while (await Cafe.exists({ slug: n === 0 ? slug : `${slug}-${n}` })) {
    n += 1;
  }
  return n === 0 ? slug : `${slug}-${n}`;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** displaySpecs is free text like "RTX 3060/4070 · 144–240Hz", so tags match on their number. */
function specPattern(tag: string): string {
  const number = tag.match(/\d+/)?.[0];
  return number ? `(?<!\\d)${number}(?!\\d)` : escapeRegex(tag);
}

/** pricePerHour and displaySpecs stay derived from pricing so search, sort, and cards keep working. */
function applyPricing(cafe: CafeDocument, pricing: CafePricing) {
  cafe.pricing = { hall: pricing.hall, vip: pricing.vip ?? null } as never;
  cafe.pricePerHour = pricing.hall.price;
  cafe.displaySpecs = pricingSummary(pricing);
  const pcs = pricing.hall.pcs + (pricing.vip?.pcs ?? 0);
  if (pcs > 0) cafe.totalPcs = pcs;
}

function queryString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function queryNumber(value: unknown): number | undefined {
  const raw = queryString(value);
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

function queryList(value: unknown): string[] {
  return queryString(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Today's date in Ulaanbaatar as YYYY-MM-DD, independent of the server timezone. */
function todayInUb(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ulaanbaatar" }).format(
    new Date(),
  );
}

function parseDate(value: unknown): string | undefined {
  const raw = queryString(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return undefined;
  return Number.isNaN(Date.parse(`${raw}T00:00:00Z`)) ? undefined : raw;
}

type PcCounts = { total: number; available: number };

async function pcCountsByCafe(
  cafeIds: mongoose.Types.ObjectId[],
): Promise<Map<string, PcCounts>> {
  if (!cafeIds.length) return new Map();
  const rows = await PC.aggregate<{ _id: mongoose.Types.ObjectId } & PcCounts>([
    { $match: { cafeId: { $in: cafeIds } } },
    {
      $group: {
        _id: "$cafeId",
        total: { $sum: 1 },
        available: { $sum: { $cond: [{ $eq: ["$status", "AVAILABLE"] }, 1, 0] } },
      },
    },
  ]);
  return new Map(rows.map((r) => [r._id.toString(), r]));
}

const SORTS: Record<CafeSort, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  price_asc: { pricePerHour: 1, createdAt: -1 },
  price_desc: { pricePerHour: -1, createdAt: -1 },
};

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

cafesRouter.get("/", async (req, res) => {
  const q = queryString(req.query.q);
  const filter: Record<string, unknown> = { status: "APPROVED" };
  const and: Record<string, unknown>[] = [];
  if (q) {
    const pattern = escapeRegex(q);
    and.push({
      $or: [
        { name: { $regex: pattern, $options: "i" } },
        { address: { $regex: pattern, $options: "i" } },
        { description: { $regex: pattern, $options: "i" } },
      ],
    });
  }

  const districts = queryList(req.query.district).filter(
    (d) => DistrictSchema.safeParse(d).success,
  );
  if (districts.length) filter.district = { $in: districts };

  const minPrice = queryNumber(req.query.minPrice);
  const maxPrice = queryNumber(req.query.maxPrice);
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.pricePerHour = {
      ...(minPrice !== undefined ? { $gte: minPrice } : {}),
      ...(maxPrice !== undefined ? { $lte: maxPrice } : {}),
    };
  }

  for (const group of [queryList(req.query.gpu), queryList(req.query.hz)]) {
    if (!group.length) continue;
    and.push({
      $or: group.map((tag) => ({
        displaySpecs: { $regex: specPattern(tag), $options: "i" },
      })),
    });
  }

  const date = parseDate(req.query.date);
  if (date) {
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    and.push({
      openingHours: { $not: { $elemMatch: { day: weekday, closed: true } } },
    });
  }

  if (and.length) filter.$and = and;

  const lat = queryNumber(req.query.lat);
  const lng = queryNumber(req.query.lng);
  const center =
    lat !== undefined &&
    lng !== undefined &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
      ? { lat, lng }
      : null;

  if (center) {
    const radiusKm = Math.min(
      Math.max(queryNumber(req.query.radiusKm) ?? 5, 0.1),
      50,
    );
    filter.location = {
      $nearSphere: {
        $geometry: { type: "Point", coordinates: [center.lng, center.lat] },
        $maxDistance: radiusKm * 1000,
      },
    };
  }

  const sortKey = queryString(req.query.sort) as CafeSort;
  const explicitSort = SORTS[sortKey];

  // $nearSphere already orders by distance; only override when a sort was chosen.
  const cafes =
    center && !explicitSort
      ? await Cafe.find(filter)
      : await Cafe.find(filter).sort(explicitSort ?? SORTS.newest);
  const counts = await pcCountsByCafe(cafes.map((c) => c._id));

  const people = queryNumber(req.query.people);
  const useLiveAvailability = !date || date === todayInUb();
  const matched =
    people && people > 1
      ? cafes.filter((c) => {
          const pcCounts = counts.get(c._id.toString());
          const capacity =
            useLiveAvailability && pcCounts ? pcCounts.available : c.totalPcs ?? 0;
          return capacity >= people;
        })
      : cafes;

  const limit = queryNumber(req.query.limit);
  const limited =
    limit !== undefined ? matched.slice(0, Math.min(Math.max(Math.floor(limit), 1), 100)) : matched;

  res.json({
    cafes: limited.map((c) => {
      const serialized = serializeCafe(c, {
        availablePcs: counts.get(c._id.toString())?.available,
      });
      const { lat: cLat, lng: cLng } = serialized.location;
      if (!center || cLat === null || cLng === null) return serialized;
      const distanceKm = haversineKm(center, { lat: cLat, lng: cLng });
      return { ...serialized, distanceKm: Math.round(distanceKm * 100) / 100 };
    }),
  });
});

export async function findApprovedCafe(idOrSlug: string) {
  const query = mongoose.isValidObjectId(idOrSlug)
    ? { $or: [{ _id: idOrSlug }, { slug: idOrSlug }] }
    : { slug: idOrSlug };
  const cafe = await Cafe.findOne(query);
  return cafe && cafe.status === "APPROVED" ? cafe : null;
}

cafesRouter.get("/:idOrSlug", async (req, res) => {
  const cafe = await findApprovedCafe(req.params.idOrSlug);
  if (!cafe) {
    res.status(404).json({ error: "Cafe not found" });
    return;
  }

  const counts = await pcCountsByCafe([cafe._id]);
  res.json({
    cafe: serializeCafe(cafe, { availablePcs: counts.get(cafe._id.toString())?.available }),
  });
});

cafesRouter.get("/:idOrSlug/pcs", async (req, res) => {
  const cafe = await findApprovedCafe(req.params.idOrSlug);
  if (!cafe) {
    res.status(404).json({ error: "Cafe not found" });
    return;
  }

  const pcs = await PC.find({ cafeId: cafe._id }).sort({ zone: 1, name: 1 });
  const count = (status: string) => pcs.filter((pc) => pc.status === status).length;
  res.json({
    pcs: pcs.map((pc) => serializePc(pc, cafe.name)),
    summary: {
      total: pcs.length,
      available: count("AVAILABLE"),
      inUse: count("IN_USE"),
      reserved: count("RESERVED"),
      offline: count("OFFLINE") + count("MAINTENANCE"),
    },
  });
});

cafesRouter.get("/:idOrSlug/booked-seats", async (req, res) => {
  const slot = BookingSlotSchema.safeParse(req.query);
  if (!slot.success) {
    res.status(400).json({ error: slot.error.issues[0]?.message ?? "Invalid slot" });
    return;
  }
  const cafe = await findApprovedCafe(req.params.idOrSlug);
  if (!cafe) {
    res.status(404).json({ error: "Cafe not found" });
    return;
  }
  const startAt = bookingStartAt(slot.data);
  const bookings = await overlappingBookings(
    cafe._id,
    startAt,
    bookingEndAt(startAt, slot.data.hours),
  );
  res.json({ seatIds: [...new Set(bookings.flatMap((b) => b.seats.map((s) => s.seatId)))] });
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
    const pricePerHour = data.pricing?.hall.price ?? data.pricePerHour;
    if (pricePerHour === undefined) {
      res.status(400).json({ error: "pricing is required" });
      return;
    }

    const slug = await uniqueSlug(data.name);
    const cafe = new Cafe({
      name: data.name,
      slug,
      description: data.description ?? "",
      address: data.address,
      district: data.district,
      phone: data.phone,
      images: data.images ?? [],
      gear: data.gear ?? "",
      displaySpecs: data.displaySpecs ?? "",
      totalPcs: data.pcCount ?? 0,
      openingHours: data.openingHours ?? defaultOpeningHours(),
      status: req.user!.role === "ADMIN" ? "APPROVED" : "PENDING",
      ownerId: req.user!.id,
      pricePerHour,
      location: {
        type: "Point",
        coordinates: [
          data.location?.lng ?? 106.917,
          data.location?.lat ?? 47.918,
        ],
      },
    });
    if (data.pricing) applyPricing(cafe, data.pricing);
    await cafe.save();

    if (data.pcs?.length) {
      await PC.insertMany(
        data.pcs.map((pc) => ({
          cafeId: cafe._id,
          name: pc.name,
          zone: pc.zone,
          status: pc.status ?? "AVAILABLE",
          specifications: pc.specifications,
          pricePerHour: pc.pricePerHour ?? pricePerHour,
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
    if (data.district !== undefined) cafe.district = data.district;
    if (data.phone !== undefined) cafe.phone = data.phone;
    if (data.pricePerHour !== undefined) cafe.pricePerHour = data.pricePerHour;
    if (data.images !== undefined) cafe.images = data.images;
    if (data.gear !== undefined) cafe.gear = data.gear;
    if (data.displaySpecs !== undefined) cafe.displaySpecs = data.displaySpecs;
    if (data.pcCount !== undefined) cafe.totalPcs = data.pcCount;
    if (data.pricing) applyPricing(cafe, data.pricing);
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
