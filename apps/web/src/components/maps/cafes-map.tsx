"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AdvancedMarker,
  Circle,
  ColorScheme,
  InfoWindow,
  Map,
  Pin,
  useMap,
} from "@vis.gl/react-google-maps";
import type { Cafe } from "@/lib/types";
import { formatMnt } from "@/lib/utils";
import { useT } from "@/components/locale-provider";
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
  onPickCenter?: (point: LatLng) => void;
  className?: string;
};

export function CafesMap({
  cafes,
  center,
  radiusKm,
  onPickCenter,
  className,
}: CafesMapProps) {
  const t = useT();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const points = useMemo(
    () =>
      cafes.flatMap((cafe) => {
        const pos = cafeLatLng(cafe.location);
        return pos ? [{ cafe, pos }] : [];
      }),
    [cafes],
  );
  const selected = points.find((p) => p.cafe.id === selectedId) ?? null;

  if (!GOOGLE_MAPS_API_KEY) {
    return <MapUnavailable className={className} />;
  }

  return (
    <div
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
        onClick={(e) => {
          const latLng = e.detail.latLng;
          setSelectedId(null);
          if (latLng && onPickCenter) onPickCenter(latLng);
        }}
        className="h-full w-full"
      >
        <FitToContent points={points.map((p) => p.pos)} center={center} radiusKm={radiusKm} />

        {points.map(({ cafe, pos }) => (
          <AdvancedMarker
            key={cafe.id}
            position={pos}
            title={cafe.name}
            onClick={() => setSelectedId(cafe.id)}
          >
            <Pin background="#4f9dff" borderColor="#3b82f6" glyphColor="#0b0f14" />
          </AdvancedMarker>
        ))}

        {center ? (
          <>
            <AdvancedMarker position={center} zIndex={1000}>
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

        {selected ? (
          <InfoWindow
            position={selected.pos}
            pixelOffset={[0, -40]}
            onCloseClick={() => setSelectedId(null)}
            headerDisabled
          >
            <div className="min-w-[160px] space-y-1 text-[13px] text-gray-900">
              <p className="font-semibold">{selected.cafe.name}</p>
              <p>
                {formatMnt(selected.cafe.pricePerHour)}
                {t("home.perHour")} · {t("home.pcs", { n: selected.cafe.pcCount ?? 0 })}
              </p>
              {typeof selected.cafe.distanceKm === "number" ? (
                <p className="text-gray-600">
                  {t("map.distance", { n: selected.cafe.distanceKm.toFixed(1) })}
                </p>
              ) : null}
              <Link
                href={`/cafes/${selected.cafe.slug}`}
                className="inline-block pt-1 font-medium text-blue-700 hover:underline"
              >
                {t("home.view")}
              </Link>
            </div>
          </InfoWindow>
        ) : null}
      </Map>
    </div>
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
    if (center) {
      const circle = new google.maps.Circle({ center, radius: radiusKm * 1000 });
      const bounds = circle.getBounds();
      if (bounds) map.fitBounds(bounds, 24);
      return;
    }
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setCenter(points[0]!);
      map.setZoom(15);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    points.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds, 48);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);

  return null;
}
