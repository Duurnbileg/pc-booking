"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, Crown, Monitor, X } from "lucide-react";
import { API_PATHS, type BookingSlot } from "@pc-booking/shared";
import { api } from "@/lib/api";
import { defaultSlot, slotQuery, slotStartsSoon, zonePrice } from "@/lib/booking";
import {
  LIVE_SEATS_ENABLED,
  VIP_ROOM_SIZE,
  mockSeats,
  type Seat,
  type SeatStatus,
  type Zone,
} from "@/lib/mock-seats";
import type { Cafe, CafePc } from "@/lib/types";
import { cn, formatMnt } from "@/lib/utils";
import { useLocale } from "@/components/locale-provider";
import { SeatMapSkeleton } from "@/components/skeletons";
import { BookingSlotPicker } from "@/components/booking-slot-picker";
import { BookingDialog } from "@/components/booking-dialog";

const REFRESH_MS = 15_000;
const BOOKED_REFRESH_MS = 30_000;
const ZONES: Zone[] = ["hall", "vip"];
const SEAT_STATUSES: SeatStatus[] = ["AVAILABLE", "IN_USE", "RESERVED"];
const SEATS_PER_ROW = 5;

const STATUS_STYLE: Record<SeatStatus, { bar: string; text: string }> = {
  AVAILABLE: { bar: "bg-status-available/60", text: "text-status-available/75" },
  IN_USE: { bar: "bg-status-inuse/40", text: "text-status-inuse/45" },
  RESERVED: { bar: "bg-status-reserved/50", text: "text-status-reserved/50" },
};

type Selection = { selected: Set<string>; toggle: (id: string) => void };

function chunk<T>(items: T[], size: number): T[][] {
  const groups: T[][] = [];
  for (let i = 0; i < items.length; i += size) groups.push(items.slice(i, i + size));
  return groups;
}

function seatsFromPcs(pcs: CafePc[]): Seat[] {
  return pcs.map((pc) => ({
    id: pc.id,
    label: pc.name.replace(/^pc[-\s]*/i, ""),
    zone: /vip/i.test(pc.zone ?? "") ? "vip" : "hall",
    status: pc.status === "AVAILABLE" || pc.status === "RESERVED" ? pc.status : "IN_USE",
  }));
}

export function PcSeatMap({ cafe }: { cafe: Cafe }) {
  const { t } = useLocale();
  const { data, isLoading } = useQuery({
    queryKey: ["cafe-pcs", cafe.slug],
    queryFn: () => api<{ pcs: CafePc[] }>(API_PATHS.cafes.pcs(cafe.slug)),
    refetchInterval: REFRESH_MS,
    enabled: LIVE_SEATS_ENABLED,
  });

  const [openZone, setOpenZone] = useState<Zone | null>(null);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [slot, setSlot] = useState<BookingSlot>(defaultSlot);
  const [dialogOpen, setDialogOpen] = useState(false);

  const booked = useQuery({
    queryKey: ["booked-seats", cafe.slug, slot],
    queryFn: () =>
      api<{ seatIds: string[] }>(`${API_PATHS.cafes.bookedSeats(cafe.slug)}?${slotQuery(slot)}`),
    placeholderData: keepPreviousData,
    refetchInterval: BOOKED_REFRESH_MS,
  });

  const isDemo = !data?.pcs.length;
  const bookedIds = new Set(booked.data?.seatIds ?? []);
  const soon = slotStartsSoon(slot);
  const allSeats = (isDemo ? mockSeats(cafe) : seatsFromPcs(data.pcs)).map(
    (seat): Seat => ({
      ...seat,
      status: bookedIds.has(seat.id)
        ? "RESERVED"
        : seat.status === "IN_USE" && !soon
          ? "AVAILABLE"
          : seat.status,
    }),
  );
  const seatsByZone: Record<Zone, Seat[]> = {
    hall: allSeats.filter((s) => s.zone === "hall"),
    vip: allSeats.filter((s) => s.zone === "vip"),
  };
  const zones = ZONES.filter((zone) => seatsByZone[zone].length);
  const activeZone = openZone && zones.includes(openZone) ? openZone : null;
  const selectedSeats = allSeats.filter((s) => selected.has(s.id) && s.status === "AVAILABLE");
  const total = selectedSeats.reduce((sum, s) => sum + zonePrice(cafe, s.zone), 0) * slot.hours;

  const selection: Selection = {
    selected,
    toggle: (id) =>
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
  };

  return (
    <section
      id="seats"
      className="scroll-mt-24 space-y-4 rounded-2xl border border-ink-800 bg-ink-900/40 p-5"
    >
      <div className="flex items-center gap-2">
        <h2 className="font-display text-xl text-ink-100">{t("seat.title")}</h2>
        {isDemo && !isLoading ? (
          <span className="rounded-full border border-ink-700 px-2 py-0.5 text-[10px] uppercase tracking-wider text-ink-500">
            {t("seat.demo")}
          </span>
        ) : null}
      </div>

      {isLoading ? (
        <SeatMapSkeleton />
      ) : (
        <>
          <BookingSlotPicker slot={slot} onChange={setSlot} />

          {selectedSeats.length ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/25 bg-accent/[0.06] px-4 py-3">
              <p className="min-w-0 text-sm text-ink-300">
                <span className="font-semibold text-accent">
                  {t("seat.selected", { n: selectedSeats.length })}
                </span>
                <span className="ml-2 text-ink-500">
                  {selectedSeats.map((s) => s.label).join(", ")}
                </span>
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  className="inline-flex items-center gap-1 text-xs font-medium text-ink-500 transition hover:text-ink-100"
                >
                  <X className="h-3.5 w-3.5" />
                  {t("seat.clear")}
                </button>
                <button
                  type="button"
                  onClick={() => setDialogOpen(true)}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-ink-950 transition hover:bg-accent-dim"
                >
                  {t("booking.bookTotal", { price: formatMnt(total) })}
                </button>
              </div>
            </div>
          ) : null}

          <div className={cn("grid gap-3", zones.length > 1 && "sm:grid-cols-2")}>
            {zones.map((zone) => (
              <ZoneToggle
                key={zone}
                zone={zone}
                open={zone === activeZone}
                onClick={() => setOpenZone((current) => (current === zone ? null : zone))}
              />
            ))}
          </div>

          {activeZone ? (
            <ZonePanel zone={activeZone} seats={seatsByZone[activeZone]} selection={selection} />
          ) : null}
        </>
      )}

      {dialogOpen ? (
        <BookingDialog
          cafe={cafe}
          slot={slot}
          seats={selectedSeats}
          onClose={() => setDialogOpen(false)}
          onBooked={() => {
            setSelected(new Set());
            void booked.refetch();
          }}
          onConflict={() => void booked.refetch()}
        />
      ) : null}
    </section>
  );
}

function ZoneToggle({ zone, open, onClick }: { zone: Zone; open: boolean; onClick: () => void }) {
  const { t } = useLocale();
  const vip = zone === "vip";
  const Icon = vip ? Crown : Monitor;
  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition",
        open
          ? vip
            ? "border-status-inuse/30 bg-status-inuse/[0.06]"
            : "border-accent/30 bg-accent/[0.06]"
          : "border-ink-800 bg-ink-950/30 hover:border-ink-700 hover:bg-ink-900/60",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg",
          vip ? "bg-status-inuse/10 text-status-inuse/80" : "bg-accent/10 text-accent/80",
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 font-medium text-ink-100">
        {t(vip ? "seat.vip" : "seat.hall")}
      </span>
      <ChevronDown
        className={cn("h-4 w-4 text-ink-500 transition-transform", open && "rotate-180")}
      />
    </button>
  );
}

function ZonePanel({ zone, seats, selection }: { zone: Zone; seats: Seat[]; selection: Selection }) {
  const { t } = useLocale();
  const counts = Object.fromEntries(
    SEAT_STATUSES.map((status) => [status, seats.filter((seat) => seat.status === status).length]),
  ) as Record<SeatStatus, number>;

  return (
    <div className="space-y-4 rounded-xl border border-ink-800/80 bg-ink-950/30 p-4">
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm text-ink-300">
            {t("seat.availableCount", { a: counts.AVAILABLE, t: seats.length })}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
            {SEAT_STATUSES.filter((status) => status !== "RESERVED" || counts[status]).map((status) => (
              <span key={status} className="inline-flex items-center gap-1.5">
                <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_STYLE[status].bar)} />
                {t(`seat.${status}`)}
                <span className="font-medium text-ink-300">{counts[status]}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="flex h-1 overflow-hidden rounded-full bg-ink-800">
          {SEAT_STATUSES.map((status) =>
            counts[status] ? (
              <div
                key={status}
                className={cn("h-full transition-all", STATUS_STYLE[status].bar)}
                style={{ width: `${(counts[status] / seats.length) * 100}%` }}
              />
            ) : null,
          )}
        </div>
      </div>

      {zone === "vip" ? (
        <VipRooms seats={seats} selection={selection} />
      ) : (
        <HallLayout seats={seats} selection={selection} />
      )}
    </div>
  );
}

/** Hall seats sit in islands: two rows of five facing each other across a shared desk. */
function HallLayout({ seats, selection }: { seats: Seat[]; selection: Selection }) {
  return (
    <div className="flex flex-wrap gap-x-8 gap-y-5">
      {chunk(seats, SEATS_PER_ROW * 2).map((island) => {
        const [front = [], back = []] = chunk(island, SEATS_PER_ROW);
        return (
          <div
            key={island[0]!.id}
            className="space-y-1.5 rounded-xl border border-ink-800/70 bg-ink-900/30 p-2"
          >
            <SeatRow seats={front} selection={selection} />
            <div aria-hidden className="h-1 rounded-full bg-ink-800" />
            {back.length ? <SeatRow seats={back} selection={selection} /> : null}
          </div>
        );
      })}
    </div>
  );
}

function VipRooms({ seats, selection }: { seats: Seat[]; selection: Selection }) {
  const { t } = useLocale();
  return (
    <div className="flex flex-wrap gap-4">
      {chunk(seats, VIP_ROOM_SIZE).map((room, i) => (
        <div
          key={room[0]!.id}
          className="space-y-2 rounded-xl border border-status-inuse/15 bg-status-inuse/[0.03] p-2.5"
        >
          <p className="text-[11px] font-medium uppercase tracking-wider text-status-inuse/60">
            {t("seat.vipRoom", { n: i + 1 })}
          </p>
          <SeatRow seats={room} selection={selection} />
        </div>
      ))}
    </div>
  );
}

function SeatRow({ seats, selection }: { seats: Seat[]; selection: Selection }) {
  return (
    <div className="grid grid-cols-[repeat(5,2.5rem)] gap-1.5">
      {seats.map((seat) => (
        <SeatTile
          key={seat.id}
          seat={seat}
          selected={selection.selected.has(seat.id)}
          onToggle={() => selection.toggle(seat.id)}
        />
      ))}
    </div>
  );
}

function SeatTile({
  seat,
  selected,
  onToggle,
}: {
  seat: Seat;
  selected: boolean;
  onToggle: () => void;
}) {
  const { t } = useLocale();
  const available = seat.status === "AVAILABLE";
  const checked = available && selected;
  return (
    <button
      type="button"
      disabled={!available}
      aria-pressed={checked}
      onClick={onToggle}
      title={`PC-${seat.label} · ${t(`seat.${seat.status}`)}`}
      className={cn(
        "relative flex h-9 w-10 items-center justify-center overflow-hidden rounded-md border text-[11px] font-medium transition duration-200",
        checked
          ? "border-accent/70 bg-accent/15 text-accent"
          : cn("border-ink-800 bg-ink-900/60", STATUS_STYLE[seat.status].text),
        available
          ? !checked && "hover:border-status-available/40 hover:bg-status-available/[0.06]"
          : "cursor-not-allowed",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-0 top-0 h-0.5",
          checked ? "bg-accent" : STATUS_STYLE[seat.status].bar,
        )}
      />
      {checked ? <Check className="h-4 w-4" /> : seat.label}
    </button>
  );
}
