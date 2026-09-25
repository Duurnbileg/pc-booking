import type { CafeDocument } from "../models/Cafe.js";
import type { PcDocument } from "../models/PC.js";

/** Phase 1: pcCount is the declared totalPcs on the cafe, not a live PC inventory count. */
export function serializeCafe(cafe: CafeDocument, _pcCount?: number) {
  return {
    id: cafe._id.toString(),
    name: cafe.name,
    slug: cafe.slug,
    description: cafe.description,
    address: cafe.address,
    location: {
      lng: cafe.location?.coordinates?.[0] ?? null,
      lat: cafe.location?.coordinates?.[1] ?? null,
    },
    phone: cafe.phone,
    images: cafe.images ?? [],
    gear: cafe.gear ?? "",
    displaySpecs: cafe.displaySpecs ?? "",
    openingHours: cafe.openingHours ?? [],
    status: cafe.status,
    ownerId: cafe.ownerId.toString(),
    pricePerHour: cafe.pricePerHour,
    pcCount: typeof cafe.totalPcs === "number" ? cafe.totalPcs : 0,
    createdAt: cafe.createdAt,
    updatedAt: cafe.updatedAt,
  };
}

export function serializePc(pc: PcDocument, cafeName?: string) {
  return {
    id: pc._id.toString(),
    cafeId: pc.cafeId.toString(),
    cafeName: cafeName ?? undefined,
    externalId: pc.externalId ?? null,
    name: pc.name,
    zone: pc.zone ?? null,
    location: pc.location ?? "",
    gear: pc.gear ?? "",
    displaySpecs: pc.displaySpecs ?? "",
    images: pc.images ?? [],
    hasVip: Boolean(pc.hasVip),
    vipPrice: pc.vipPrice ?? null,
    stagePrice: pc.stagePrice ?? null,
    hallPrice: pc.hallPrice ?? null,
    status: pc.status,
    specifications: pc.specifications ?? null,
    pricePerHour: pc.pricePerHour ?? null,
    createdAt: pc.createdAt,
    updatedAt: pc.updatedAt,
  };
}
