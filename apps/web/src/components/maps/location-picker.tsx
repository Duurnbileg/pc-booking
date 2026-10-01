"use client";

import { useEffect, useRef, useState } from "react";
import {
  AdvancedMarker,
  ColorScheme,
  Map,
  Pin,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { useT } from "@/components/locale-provider";
import { cn } from "@/lib/utils";
import {
  GOOGLE_MAPS_API_KEY,
  GOOGLE_MAPS_MAP_ID,
  MapUnavailable,
  UB_CENTER,
  getCurrentPosition,
  type LatLng,
} from "@/components/maps/maps-provider";

const MAP_ID = "location-picker";

type LocationPickerProps = {
  value: LatLng | null;
  onChange: (location: LatLng, address?: string) => void;
  disabled?: boolean;
  variant?: "dark" | "light";
};

export function LocationPicker({
  value,
  onChange,
  disabled,
  variant = "dark",
}: LocationPickerProps) {
  const t = useT();
  const light = variant === "light";
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  if (!GOOGLE_MAPS_API_KEY) {
    return <MapUnavailable className="h-40" />;
  }

  async function locateMe() {
    setGeoError(null);
    setLocating(true);
    try {
      onChange(await getCurrentPosition());
    } catch (err) {
      setGeoError(
        err instanceof Error && err.message === "unsupported"
          ? t("map.geoUnsupported")
          : t("map.permissionDenied"),
      );
    } finally {
      setLocating(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className={cn("text-xs", light ? "text-slate-500" : "text-ink-500")}>
        {t("map.pickHint")}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <PlaceSearch
          disabled={disabled}
          light={light}
          placeholder={t("map.searchAddress")}
          onSelect={(location, address) => onChange(location, address)}
        />
        <button
          type="button"
          disabled={disabled || locating}
          onClick={locateMe}
          className={cn(
            "shrink-0 rounded-xl border px-3 py-2.5 text-sm transition disabled:opacity-60",
            light
              ? "rounded-lg border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              : "border-ink-700 text-ink-100 hover:border-accent hover:text-accent",
          )}
        >
          {locating ? t("map.locating") : t("map.useMyLocation")}
        </button>
      </div>
      {geoError ? (
        <p className={cn("text-sm", light ? "text-red-600" : "text-status-reserved")}>
          {geoError}
        </p>
      ) : null}

      <div
        className={cn(
          "h-72 overflow-hidden border",
          light ? "rounded-lg border-slate-200" : "rounded-xl border-ink-700",
        )}
      >
        <Map
          id={MAP_ID}
          mapId={GOOGLE_MAPS_MAP_ID}
          defaultCenter={value ?? UB_CENTER}
          defaultZoom={value ? 16 : 12}
          colorScheme={light ? ColorScheme.LIGHT : ColorScheme.DARK}
          gestureHandling="greedy"
          disableDefaultUI
          zoomControl
          clickableIcons={false}
          onClick={(e) => {
            if (!disabled && e.detail.latLng) onChange(e.detail.latLng);
          }}
          className="h-full w-full"
        >
          <PanTo location={value} />
          {value ? (
            <AdvancedMarker
              position={value}
              draggable={!disabled}
              onDragEnd={(e) => {
                const latLng = e.latLng?.toJSON();
                if (latLng) onChange(latLng);
              }}
            >
              <Pin background="#4f9dff" borderColor="#3b82f6" glyphColor="#0b0f14" />
            </AdvancedMarker>
          ) : null}
        </Map>
      </div>
      <p className={cn("text-xs", light ? "text-slate-500" : "text-ink-500")}>
        {value
          ? `${value.lat.toFixed(6)}, ${value.lng.toFixed(6)}`
          : t("map.noLocation")}
      </p>
    </div>
  );
}

function PanTo({ location }: { location: LatLng | null }) {
  const map = useMap(MAP_ID);
  useEffect(() => {
    if (!map || !location) return;
    map.panTo(location);
    if ((map.getZoom() ?? 0) < 15) map.setZoom(16);
  }, [map, location]);
  return null;
}

function PlaceSearch({
  onSelect,
  placeholder,
  disabled,
  light,
}: {
  onSelect: (location: LatLng, address: string) => void;
  placeholder: string;
  disabled?: boolean;
  light?: boolean;
}) {
  const places = useMapsLibrary("places");
  const containerRef = useRef<HTMLDivElement>(null);
  const elementRef = useRef<google.maps.places.PlaceAutocompleteElement | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    const container = containerRef.current;
    if (!places || !container) return;

    const element = new places.PlaceAutocompleteElement({
      includedRegionCodes: ["mn"],
      locationBias: UB_CENTER,
    });
    element.style.colorScheme = light ? "light" : "dark";
    element.style.width = "100%";
    container.appendChild(element);
    elementRef.current = element;

    const handleSelect = async (event: Event) => {
      const { placePrediction } =
        event as google.maps.places.PlacePredictionSelectEvent;
      const place = placePrediction.toPlace();
      await place.fetchFields({ fields: ["location", "formattedAddress"] });
      if (!place.location) return;
      onSelectRef.current(
        { lat: place.location.lat(), lng: place.location.lng() },
        place.formattedAddress ?? "",
      );
    };
    element.addEventListener("gmp-select", handleSelect);

    return () => {
      element.removeEventListener("gmp-select", handleSelect);
      element.remove();
      elementRef.current = null;
    };
  }, [places, light]);

  useEffect(() => {
    if (!elementRef.current) return;
    elementRef.current.placeholder = placeholder;
    elementRef.current.disabled = Boolean(disabled);
  }, [placeholder, disabled, places]);

  return <div ref={containerRef} className="min-w-0 flex-1" />;
}
