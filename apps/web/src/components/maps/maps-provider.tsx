"use client";

import type { ReactNode } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import { useLocale } from "@/components/locale-provider";

export const GOOGLE_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

// AdvancedMarker requires a map ID; DEMO_MAP_ID is Google's shared default.
export const GOOGLE_MAPS_MAP_ID =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

export const UB_CENTER: google.maps.LatLngLiteral = {
  lat: 47.918,
  lng: 106.917,
};

export type LatLng = { lat: number; lng: number };

export function cafeLatLng(location: {
  lat: number | null;
  lng: number | null;
}): LatLng | null {
  if (location.lat === null || location.lng === null) return null;
  return { lat: location.lat, lng: location.lng };
}

export function haversineKm(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export function directionsUrl(position: LatLng): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${position.lat},${position.lng}`;
}

export function MapsProvider({ children }: { children: ReactNode }) {
  if (!GOOGLE_MAPS_API_KEY) return <>{children}</>;
  return (
    <APIProvider
      apiKey={GOOGLE_MAPS_API_KEY}
      libraries={["places", "marker"]}
      region="MN"
    >
      {children}
    </APIProvider>
  );
}

export function MapUnavailable({ className }: { className?: string }) {
  const { t } = useLocale();
  return (
    <div
      className={`flex items-center justify-center rounded-2xl border border-dashed border-ink-700 bg-ink-900/50 p-6 text-center text-sm text-ink-500 ${className ?? ""}`}
    >
      {t("map.unavailable")}
    </div>
  );
}

export function getCurrentPosition(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("unsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  });
}
