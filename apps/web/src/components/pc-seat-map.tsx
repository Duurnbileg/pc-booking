"use client";

import { useQuery } from "@tanstack/react-query";
import { Crown } from "lucide-react";
import { API_PATHS, type PcStatus } from "@pc-booking/shared";
import { api } from "@/lib/api";
import type { Cafe, CafePc } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/locale-provider";
import { PC_STATUS_META } from "@/components/pc-status";
import { SeatMapSkeleton } from "@/components/skeletons";

const REFRESH_MS = 15_000;

type Zone = "hall" | "vip";
type SeatStatus = Extract<PcStatus, "AVAILABLE" | "IN_USE">;
type Seat = { id: string; label: string; zone: Zone; status: SeatStatus };

const SEAT_STATUSES: SeatStatus[] = ["AVAILABLE", "IN_USE"];
const DEFAULT_MOCK_PCS = 24;

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

/** Seeded by slug so the demo layout stays the same across reloads. */
function mockSeats(cafe: Cafe): Seat[] {
  const random = mulberry32(hashString(cafe.slug));
  let hallCount = cafe.pricing.hall.pcs ?? 0;
  const vipCount = cafe.pricing.vip?.pcs ?? 0;
  if (hallCount + vipCount === 0) hallCount = cafe.pcCount || DEFAULT_MOCK_PCS;
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

function seatsFromPcs(pcs: CafePc[]): Seat[] {
  return pcs.map((pc) => ({
    id: pc.id,
    label: pc.name.replace(/^pc[-\s]*/i, ""),
    zone: /vip/i.test(pc.zone ?? "") ? "vip" : "hall",
    status: pc.status === "AVAILABLE" ? "AVAILABLE" : "IN_USE",
  }));
}

export function PcSeatMap({ cafe }: { cafe: Cafe }) {
  const { t } = useLocale();
  const { data, isLoading } = useQuery({
    queryKey: ["cafe-pcs", cafe.slug],
    queryFn: () => api<{ pcs: CafePc[] }>(API_PATHS.cafes.pcs(cafe.slug)),
    refetchInterval: REFRESH_MS,
  });

  const isDemo = !data?.pcs.length;
  const seats = isDemo ? mockSeats(cafe) : seatsFromPcs(data.pcs);
  const counts = Object.fromEntries(
    SEAT_STATUSES.map((status) => [status, seats.filter((seat) => seat.status === status).length]),
  ) as Record<SeatStatus, number>;

  const zones = (["hall", "vip"] as const)
    .map((zone) => ({ zone, seats: seats.filter((s) => s.zone === zone) }))
    .filter((z) => z.seats.length);

  return (
    <section className="space-y-5 rounded-2xl border border-ink-800 bg-ink-900/50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-xl text-ink-100">{t("seat.title")}</h2>
          {isDemo && !isLoading ? (
            <span className="rounded-full border border-ink-700 px-2 py-0.5 text-[10px] uppercase tracking-wider text-ink-500">
              {t("seat.demo")}
            </span>
          ) : null}
        </div>
        {!isLoading ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-status-available/40 bg-status-available/10 px-3 py-1 text-sm font-medium text-status-available">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-available opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-status-available" />
            </span>
            {t("seat.availableCount", { a: counts.AVAILABLE, t: seats.length })}
          </span>
        ) : null}
      </div>

      {isLoading ? (
        <SeatMapSkeleton />
      ) : (
        <>
          <div className="space-y-3">
            <div className="flex h-2 overflow-hidden rounded-full bg-ink-800">
              {SEAT_STATUSES.map((status) =>
                counts[status] ? (
                  <div
                    key={status}
                    className={cn("h-full transition-all", PC_STATUS_META[status].dot)}
                    style={{ width: `${(counts[status] / seats.length) * 100}%` }}
                  />
                ) : null,
              )}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-ink-300">
              {SEAT_STATUSES.map((status) => (
                <span key={status} className="inline-flex items-center gap-1.5">
                  <span className={cn("h-2 w-2 rounded-full", PC_STATUS_META[status].dot)} />
                  {t(`seat.${status}`)}
                  <span className="font-semibold text-ink-100">{counts[status]}</span>
                </span>
              ))}
            </div>
          </div>

          {zones.map(({ zone, seats: zoneSeats }) => (
            <div key={zone} className="space-y-2.5">
              <h3
                className={cn(
                  "inline-flex items-center gap-1.5 text-sm font-semibold",
                  zone === "vip" ? "text-status-inuse" : "text-accent",
                )}
              >
                {zone === "vip" ? <Crown className="h-3.5 w-3.5" /> : null}
                {t(zone === "vip" ? "seat.vip" : "seat.hall")}
              </h3>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] gap-1.5">
                {zoneSeats.map((seat) => (
                  <SeatTile key={seat.id} seat={seat} />
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </section>
  );
}

function SeatTile({ seat }: { seat: Seat }) {
  const { t } = useLocale();
  const available = seat.status === "AVAILABLE";
  return (
    <div
      title={`PC-${seat.label} · ${t(`seat.${seat.status}`)}`}
      className={cn(
        "flex h-9 items-center justify-center rounded-lg border text-[11px] font-medium transition duration-200",
        PC_STATUS_META[seat.status].className,
        available
          ? "cursor-pointer hover:scale-105 hover:bg-status-available/20"
          : "opacity-70",
      )}
    >
      {seat.label}
    </div>
  );
}
