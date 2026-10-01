"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AdvancedMarker, Circle, ColorScheme, Map, useMap } from "@vis.gl/react-google-maps";
import { ArrowRight, MapPin, Navigation } from "lucide-react";
import { AvailabilityBadge } from "@/components/availability-badge";
import type { Cafe } from "@/lib/types";
import { cn, districtLabel, formatMnt } from "@/lib/utils";
import { useLocale } from "@/components/locale-provider";
import {
  GOOGLE_MAPS_API_KEY,
  GOOGLE_MAPS_MAP_ID,
  MapUnavailable,
  UB_CENTER,
  cafeLatLng,
  type LatLng,
} from "@/components/maps/maps-provider";

const MAP_ID = "cafes-map";

type CafesMapProps = {
  cafes: Cafe[];
  center: LatLng | null;
  radiusKm: number;
  className?: string;
};

function haversineKm(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export function CafesMap({ cafes, center, radiusKm, className }: CafesMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);

  const points = useMemo(
    () =>
      cafes.flatMap((cafe) => {
        const pos = cafeLatLng(cafe.location);
        if (!pos) return [];
        const distanceKm = cafe.distanceKm ?? (center ? haversineKm(center, pos) : undefined);
        return [{ cafe, pos, distanceKm }];
      }),
    [cafes, center],
  );

  if (!GOOGLE_MAPS_API_KEY) {
    return <MapUnavailable className={className} />;
  }

  const openId = hoveredId ?? pinnedId;

  return (
    <div
      data-cafes-map
      className={`overflow-hidden rounded-2xl border border-ink-800 ${className ?? ""}`}
    >
      <Map
        id={MAP_ID}
        mapId={GOOGLE_MAPS_MAP_ID}
        defaultCenter={UB_CENTER}
        defaultZoom={12}
        colorScheme={ColorScheme.DARK}
        gestureHandling="cooperative"
        disableDefaultUI
        zoomControl
        onClick={() => setPinnedId(null)}
        className="h-full w-full"
      >
        <FitToContent points={points.map((p) => p.pos)} center={center} radiusKm={radiusKm} />

        {center ? (
          <>
            <AdvancedMarker position={center} zIndex={500}>
              <div className="h-4 w-4 rounded-full border-2 border-white bg-sky-500 shadow-[0_0_0_6px_rgba(14,165,233,0.25)]" />
            </AdvancedMarker>
            <Circle
              center={center}
              radius={radiusKm * 1000}
              strokeColor="#0ea5e9"
              strokeOpacity={0.8}
              strokeWeight={2}
              fillColor="#0ea5e9"
              fillOpacity={0.08}
              clickable={false}
            />
          </>
        ) : null}

        {points.map(({ cafe, pos, distanceKm }) => {
          const open = openId === cafe.id;
          return (
            <AdvancedMarker
              key={cafe.id}
              position={pos}
              title={cafe.name}
              zIndex={open ? 1000 : undefined}
              onMouseEnter={() => setHoveredId(cafe.id)}
              onMouseLeave={() => setHoveredId((id) => (id === cafe.id ? null : id))}
              onClick={() => setPinnedId((id) => (id === cafe.id ? null : cafe.id))}
            >
              <div className="relative flex flex-col items-center">
                {open ? <CafeHoverCard cafe={cafe} distanceKm={distanceKm} /> : null}
                <CafePin active={open} />
              </div>
            </AdvancedMarker>
          );
        })}
      </Map>
    </div>
  );
}

function CafePin({ active }: { active: boolean }) {
  return (
    <svg
      width="28"
      height="36"
      viewBox="0 0 28 36"
      className={cn("drop-shadow-md transition-transform duration-150", active && "scale-125")}
      style={{ transformOrigin: "50% 100%" }}
      aria-hidden
    >
      <path
        d="M14 35s12-11.2 12-21A12 12 0 0 0 2 14c0 9.8 12 21 12 21Z"
        fill={active ? "#3b82f6" : "#4f9dff"}
        stroke="#0b0f14"
        strokeWidth="1.5"
      />
      <circle cx="14" cy="14" r="4.5" fill="#0b0f14" />
    </svg>
  );
}

const CARD_EDGE_GAP = 8;

function CafeHoverCard({ cafe, distanceKm }: { cafe: Cafe; distanceKm?: number }) {
  const { t, locale } = useLocale();
  const cover = cafe.images?.[0];
  const district = cafe.district ? districtLabel(cafe.district, locale) : "";
  const ref = useRef<HTMLAnchorElement>(null);
  const [placement, setPlacement] = useState({ below: false, shiftX: 0 });

  useLayoutEffect(() => {
    const card = ref.current;
    const frame = card?.closest("[data-cafes-map]");
    if (!card || !frame) return;
    const c = card.getBoundingClientRect();
    const f = frame.getBoundingClientRect();
    const below = c.top < f.top + CARD_EDGE_GAP;
    let shiftX = 0;
    if (c.left < f.left + CARD_EDGE_GAP) shiftX = f.left + CARD_EDGE_GAP - c.left;
    else if (c.right > f.right - CARD_EDGE_GAP) shiftX = f.right - CARD_EDGE_GAP - c.right;
    setPlacement({ below, shiftX });
  }, []);

  return (
    <Link
      ref={ref}
      href={`/cafes/${cafe.slug}`}
      onClick={(e) => e.stopPropagation()}
      style={{ transform: `translateX(${placement.shiftX}px)` }}
      className={cn(
        "group absolute w-60 overflow-hidden rounded-xl border border-ink-700 bg-ink-900 text-left shadow-[0_16px_40px_rgba(0,0,0,0.5)]",
        placement.below ? "top-full mt-2" : "bottom-full mb-2",
      )}
    >
      <div className="relative h-24 bg-ink-800">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="h-full w-full object-cover" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 to-transparent" />
        <span className="absolute right-2 top-2 rounded-full bg-ink-950/80 px-2 py-0.5 text-xs font-semibold text-accent ring-1 ring-accent/30">
          {formatMnt(cafe.pricePerHour)}
          <span className="font-normal text-ink-300">{t("home.perHour")}</span>
        </span>
        <p className="absolute inset-x-3 bottom-2 truncate font-display text-sm font-semibold text-white">
          {cafe.name}
        </p>
      </div>
      <div className="space-y-2 p-3">
        <div className="flex flex-wrap gap-1.5 text-[11px] text-ink-100">
          <AvailabilityBadge
            available={cafe.availablePcs}
            total={cafe.pcCount ?? 0}
            className="px-2 py-0.5 text-[11px]"
          />
          {district ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-ink-800 px-2 py-0.5">
              <MapPin className="h-3 w-3 text-accent" />
              {district}
            </span>
          ) : null}
          {typeof distanceKm === "number" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-ink-800 px-2 py-0.5">
              <Navigation className="h-3 w-3 text-accent" />
              {t("map.distance", { n: distanceKm.toFixed(1) })}
            </span>
          ) : null}
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-ink-100 group-hover:text-accent">
          {t("home.details")}
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}

function FitToContent({
  points,
  center,
  radiusKm,
}: {
  points: LatLng[];
  center: LatLng | null;
  radiusKm: number;
}) {
  const map = useMap(MAP_ID);
  const key = JSON.stringify({ points, center, radiusKm });

  useEffect(() => {
    if (!map) return;
    const bounds = new google.maps.LatLngBounds();
    points.forEach((p) => bounds.extend(p));
    if (center) {
      const circleBounds = new google.maps.Circle({ center, radius: radiusKm * 1000 }).getBounds();
      if (circleBounds) bounds.union(circleBounds);
    }
    if (bounds.isEmpty()) return;
    if (points.length === 1 && !center) {
      map.setCenter(points[0]!);
      map.setZoom(15);
      return;
    }
    map.fitBounds(bounds, 48);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);

  return null;
}
