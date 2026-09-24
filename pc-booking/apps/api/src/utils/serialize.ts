import type { CafeDocument } from "../models/Cafe.js";
import type { PcDocument } from "../models/PC.js";

export function serializeCafe(cafe: CafeDocument, pcCount?: number) {
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
    openingHours: cafe.openingHours ?? [],
    status: cafe.status,
    ownerId: cafe.ownerId.toString(),
    pricePerHour: cafe.pricePerHour,
    pcCount: pcCount ?? undefined,
    createdAt: cafe.createdAt,
    updatedAt: cafe.updatedAt,
  };
}

export function serializePc(pc: PcDocument) {
  return {
    id: pc._id.toString(),
    cafeId: pc.cafeId.toString(),
    externalId: pc.externalId ?? null,
    name: pc.name,
    zone: pc.zone ?? null,
    status: pc.status,
    specifications: pc.specifications ?? null,
    pricePerHour: pc.pricePerHour ?? null,
    createdAt: pc.createdAt,
    updatedAt: pc.updatedAt,
  };
}
