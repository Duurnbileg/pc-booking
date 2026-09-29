"use client";

import {
  AdvancedMarker,
  ColorScheme,
  Map,
  Pin,
} from "@vis.gl/react-google-maps";
import {
  GOOGLE_MAPS_API_KEY,
  GOOGLE_MAPS_MAP_ID,
  MapUnavailable,
  type LatLng,
} from "@/components/maps/maps-provider";

export function CafeLocationMap({
  position,
  title,
  className,
}: {
  position: LatLng;
  title: string;
  className?: string;
}) {
  if (!GOOGLE_MAPS_API_KEY) {
    return <MapUnavailable className={className} />;
  }

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-ink-800 ${className ?? ""}`}
    >
      <Map
        mapId={GOOGLE_MAPS_MAP_ID}
        defaultCenter={position}
        defaultZoom={15}
        colorScheme={ColorScheme.DARK}
        gestureHandling="cooperative"
        disableDefaultUI
        zoomControl
        className="h-full w-full"
      >
        <AdvancedMarker position={position} title={title}>
          <Pin background="#3ddc97" borderColor="#2bb87a" glyphColor="#0b0f14" />
        </AdvancedMarker>
      </Map>
    </div>
  );
}

export function directionsUrl(position: LatLng): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${position.lat},${position.lng}`;
}
