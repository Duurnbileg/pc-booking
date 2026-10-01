import "./config/env.js";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { Types } from "mongoose";
import { connectDb } from "./db.js";
import { User } from "./models/User.js";
import { Cafe } from "./models/Cafe.js";
import { PC } from "./models/PC.js";
import { Integration } from "./models/Integration.js";
import { pricingSummary, type CafePricing, type District, type PricingTier } from "@pc-booking/shared";

type GogameCafe = {
  gogameId: string;
  icafeCloudId: number | null;
  name: string;
  slug: string;
  description: string;
  address: string;
  district: District;
  phone: string;
  coordinates: [number, number];
  is24_7: boolean;
  images: string[];
  facebook: string | null;
  pricing: CafePricing;
};

const dataPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "data/gogame-cafes.json");

function openingHours(is24_7: boolean) {
  return Array.from({ length: 7 }, (_, day) => ({
    day,
    open: is24_7 ? "00:00" : "10:00",
    close: is24_7 ? "23:59" : "02:00",
    closed: false,
  }));
}

function ramGb(ram: string): number | undefined {
  const match = /(\d+)\s*GB/i.exec(ram);
  return match ? Number(match[1]) : undefined;
}

function makePcs(cafeId: Types.ObjectId, slug: string, pricing: CafePricing) {
  const zones: [string, PricingTier][] = [["Main Hall", pricing.hall]];
  if (pricing.vip) zones.push(["VIP", pricing.vip]);

  let n = 0;
  return zones.flatMap(([zone, tier]) =>
    Array.from({ length: tier.pcs }, () => {
      n += 1;
      const id = String(n).padStart(2, "0");
      return {
        cafeId,
        externalId: `${slug}-${id}`,
        name: `PC-${id}`,
        zone,
        status: "AVAILABLE" as const,
        pricePerHour: tier.price,
        specifications: { cpu: tier.cpu, gpu: tier.gpu, ram: ramGb(tier.ram) },
      };
    }),
  );
}

/** Upserts the gogame.mn cafes by slug; cafes from other sources are left untouched. */
export async function importGogameCafes(ownerId: Types.ObjectId) {
  const cafes = JSON.parse(readFileSync(dataPath, "utf8")) as GogameCafe[];

  for (const def of cafes) {
    const totalPcs = def.pricing.hall.pcs + (def.pricing.vip?.pcs ?? 0);
    const cafe = await Cafe.findOneAndUpdate(
      { slug: def.slug },
      {
        $set: {
          name: def.name,
          description: def.description,
          address: def.address,
          district: def.district,
          phone: def.phone,
          images: def.images,
          displaySpecs: pricingSummary(def.pricing),
          openingHours: openingHours(def.is24_7),
          pricePerHour: def.pricing.hall.price,
          pricing: def.pricing,
          totalPcs,
          location: { type: "Point", coordinates: def.coordinates },
        },
        $setOnInsert: { slug: def.slug, status: "APPROVED", ownerId },
      },
      { upsert: true, new: true },
    );

    if ((await PC.countDocuments({ cafeId: cafe._id })) === 0) {
      await PC.insertMany(makePcs(cafe._id, def.slug, def.pricing));
    }

    await Integration.updateOne(
      { cafeId: cafe._id },
      {
        $setOnInsert: {
          provider: def.icafeCloudId ? "ICAFE_CLOUD" : "MOCK",
          cafeExternalId: def.icafeCloudId ? String(def.icafeCloudId) : undefined,
          status: "DISCONNECTED",
        },
      },
      { upsert: true },
    );
  }

  return cafes.length;
}

async function main() {
  await connectDb();
  const owner =
    (await User.findOne({ email: "owner@pcbooking.mn" })) ??
    (await User.findOne({ role: { $in: ["CAFE_OWNER", "ADMIN"] } }));
  if (!owner) throw new Error("No CAFE_OWNER or ADMIN user found; run `pnpm seed` first.");

  const count = await importGogameCafes(owner._id);
  console.log(`Imported ${count} gogame.mn cafes (owner: ${owner.email}).`);
  process.exit(0);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
