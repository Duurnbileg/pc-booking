import type { PcStatus } from "@pc-booking/shared";
import type { Cafe } from "@/lib/types";

/** Stored PC records are seeded placeholders; enable once gaming center systems report live status. */
export const LIVE_SEATS_ENABLED = false;

export type Zone = "hall" | "vip";
export type SeatStatus = Extract<PcStatus, "AVAILABLE" | "IN_USE" | "RESERVED">;
export type Seat = { id: string; label: string; zone: Zone; status: SeatStatus };

export const VIP_ROOM_SIZE = 5;
const MOCK_MIN_PCS = 100;
const MOCK_MAX_PCS = 200;
const DEFAULT_VIP_SHARE = 0.3;

function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seeded by slug so the demo layout stays the same across reloads and pages. */
export function mockSeats(cafe: Cafe): Seat[] {
  const random = mulberry32(hashString(cafe.slug));
  const total = MOCK_MIN_PCS + Math.floor(random() * (MOCK_MAX_PCS - MOCK_MIN_PCS + 1));
  const hallPcs = cafe.pricing.hall.pcs ?? 0;
  const vipPcs = cafe.pricing.vip?.pcs ?? 0;
  const vipShare = !cafe.pricing.vip
    ? 0
    : hallPcs + vipPcs > 0
      ? vipPcs / (hallPcs + vipPcs)
      : DEFAULT_VIP_SHARE;
  const vipCount = Math.round((total * vipShare) / VIP_ROOM_SIZE) * VIP_ROOM_SIZE;
  const hallCount = total - vipCount;
  const labelWidth = Math.max(2, String(hallCount).length);
  const randomStatus = (): SeatStatus => (random() < 0.45 ? "AVAILABLE" : "IN_USE");

  const seats: Seat[] = [];
  for (let i = 1; i <= hallCount; i++) {
    seats.push({
      id: `hall-${i}`,
      label: String(i).padStart(labelWidth, "0"),
      zone: "hall",
      status: randomStatus(),
    });
  }
  for (let i = 1; i <= vipCount; i++) {
    seats.push({ id: `vip-${i}`, label: `V${i}`, zone: "vip", status: randomStatus() });
  }
  return seats;
}

export type CafeSeatStats = {
  total: number;
  available: number | null;
  byZone: Record<Zone, number>;
};

export function cafeSeatStats(cafe: Cafe): CafeSeatStats {
  if (LIVE_SEATS_ENABLED) {
    return {
      total: cafe.pcCount ?? 0,
      available: cafe.availablePcs ?? null,
      byZone: { hall: cafe.pricing.hall.pcs ?? 0, vip: cafe.pricing.vip?.pcs ?? 0 },
    };
  }
  const seats = mockSeats(cafe);
  return {
    total: seats.length,
    available: seats.filter((s) => s.status === "AVAILABLE").length,
    byZone: {
      hall: seats.filter((s) => s.zone === "hall").length,
      vip: seats.filter((s) => s.zone === "vip").length,
    },
  };
}
