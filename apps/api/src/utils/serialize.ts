import type { CafeDocument } from "../models/Cafe.js";
import type { PcDocument } from "../models/PC.js";
import type { UserDocument } from "../models/User.js";

/** Only fields safe for the admin UI; never add passwordHash or tokens here. */
export function serializeCustomer(user: UserDocument) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt ?? null,
  };
}

export function serializeOwner(user: UserDocument | null | undefined) {
  if (!user) return null;
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
  };
}

/**
 * pcCount is the declared totalPcs on the cafe. availablePcs counts PC records with
 * AVAILABLE status (null when the cafe has no PC records yet).
 */
export function serializeCafe(
  cafe: CafeDocument,
  options: { availablePcs?: number | null } = {},
) {
  return {
    id: cafe._id.toString(),
    name: cafe.name,
    slug: cafe.slug,
    description: cafe.description,
    address: cafe.address,
    district: cafe.district ?? null,
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
    rejectionReason: cafe.rejectionReason ?? "",
    ownerId: cafe.ownerId.toString(),
    pricePerHour: cafe.pricePerHour,
    pcCount: typeof cafe.totalPcs === "number" ? cafe.totalPcs : 0,
    availablePcs: options.availablePcs ?? null,
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
