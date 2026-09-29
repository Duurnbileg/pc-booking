"use client";

import Link from "next/link";
import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { API_PATHS } from "@pc-booking/shared";
import { api } from "@/lib/api";
import type { Cafe } from "@/lib/types";
import { cn, districtLabel, formatMnt } from "@/lib/utils";
import { useLocale } from "@/components/locale-provider";
import { SearchBar } from "@/components/search-bar";
import { CafeGridSkeleton } from "@/components/skeletons";
import { CafeCoverFallback, ImageWithSkeleton } from "@/components/image-with-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { CafesMap } from "@/components/maps/cafes-map";
import {
  getCurrentPosition,
  type LatLng,
} from "@/components/maps/maps-provider";

const RADIUS_OPTIONS = [1, 3, 5, 10, 20];

function cafeBlurb(cafe: Cafe): string {
  const parts: string[] = [];
  if (cafe.address) parts.push(cafe.address);
  if (cafe.gear) parts.push(cafe.gear);
  if (cafe.displaySpecs) parts.push(cafe.displaySpecs);
  if (!parts.length && cafe.description) return cafe.description;
  return parts.join(" · ");
}

export default function HomePage() {
  const { t, locale } = useLocale();
  const [center, setCenter] = useState<LatLng | null>(null);
  const [radiusKm, setRadiusKm] = useState(5);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");

  const { data, isLoading, error } = useQuery({
    queryKey: ["cafes", center?.lat, center?.lng, radiusKm],
    queryFn: () => {
      const params = new URLSearchParams();
      if (center) {
        params.set("lat", String(center.lat));
        params.set("lng", String(center.lng));
        params.set("radiusKm", String(radiusKm));
      }
      const qs = params.toString();
      return api<{ cafes: Cafe[] }>(
        `${API_PATHS.cafes.list}${qs ? `?${qs}` : ""}`,
      );
    },
    placeholderData: keepPreviousData,
  });

  const cafes = data?.cafes ?? [];
  const subtitle = center
    ? t("map.nearResults", { r: radiusKm })
    : t("home.subtitleDefault");

  async function locateMe() {
    setGeoError(null);
    setLocating(true);
    try {
      setCenter(await getCurrentPosition());
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
    <div className="space-y-10">
      <section className="space-y-4">
        <p className="font-display text-4xl sm:text-5xl tracking-tight text-ink-100">
          PC<span className="text-accent">Book</span>
        </p>
        <h1 className="text-xl text-ink-300 max-w-xl">{t("home.tagline")}</h1>
        <SearchBar />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={locateMe}
            disabled={locating}
            className={cn(
              "rounded-lg border px-4 py-2 text-sm transition disabled:opacity-60",
              center
                ? "border-accent bg-accent/10 text-accent"
                : "border-ink-700 text-ink-100 hover:border-accent hover:text-accent",
            )}
          >
            {locating ? t("map.locating") : t("map.nearMe")}
          </button>
          <label className="flex items-center gap-2 text-sm text-ink-300">
            {t("map.radius")}
            <select
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="rounded-lg border border-ink-700 bg-ink-900/80 px-3 py-2 text-ink-100"
            >
              {RADIUS_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {t("map.km", { n: r })}
                </option>
              ))}
            </select>
          </label>
          {center ? (
            <button
              type="button"
              onClick={() => setCenter(null)}
              className="rounded-lg px-3 py-2 text-sm text-ink-500 hover:text-ink-100"
            >
              {t("map.clear")}
            </button>
          ) : null}
        </div>
        {geoError ? (
          <p className="text-sm text-status-reserved">{geoError}</p>
        ) : (
          <p className="text-xs text-ink-500">{t("map.clickHint")}</p>
        )}
      </section>

      <div className="flex gap-2 sm:hidden">
        {(["list", "map"] as const).map((view) => (
          <button
            key={view}
            type="button"
            onClick={() => setMobileView(view)}
            className={cn(
              "flex-1 rounded-lg border px-3 py-2 text-sm",
              mobileView === view
                ? "border-accent text-accent"
                : "border-ink-700 text-ink-300",
            )}
          >
            {view === "list" ? t("map.showList") : t("map.showMap")}
          </button>
        ))}
      </div>

      <CafesMap
        cafes={cafes}
        center={center}
        radiusKm={radiusKm}
        onPickCenter={(point) => {
          setGeoError(null);
          setCenter(point);
        }}
        className={cn(
          "h-[360px] sm:h-[420px]",
          mobileView === "map" ? "block" : "hidden sm:block",
        )}
      />

      <section
        className={cn(
          "space-y-5",
          mobileView === "list" ? "block" : "hidden sm:block",
        )}
      >
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl text-ink-100">{subtitle}</h2>
          {isLoading ? (
            <Skeleton className="h-4 w-16" />
          ) : (
            <span className="text-sm text-ink-500">
              {t("home.centersCount", { n: cafes.length })}
            </span>
          )}
        </div>

        {isLoading ? (
          <CafeGridSkeleton count={6} />
        ) : error ? (
          <p className="text-status-reserved">{t("home.loadError")}</p>
        ) : cafes.length === 0 ? (
          <p className="text-ink-500">{t("home.empty")}</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cafes.map((cafe) => {
              const cover = cafe.images?.[0];
              const blurb = cafeBlurb(cafe);
              return (
                <Link
                  key={cafe.id}
                  href={`/cafes/${cafe.slug}`}
                  className="group overflow-hidden rounded-2xl border border-ink-800 bg-ink-900/50 shadow-[0_12px_40px_rgba(0,0,0,0.25)] transition hover:border-accent/40 hover:bg-ink-900/80"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-ink-800">
                    {cover ? (
                      <ImageWithSkeleton
                        src={cover}
                        alt={cafe.name}
                        className="transition-[opacity,transform] group-hover:scale-[1.03]"
                        fallback={<CafeCoverFallback />}
                      />
                    ) : (
                      <CafeCoverFallback />
                    )}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ink-950/80 to-transparent" />
                  </div>

                  <div className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-lg text-accent transition group-hover:text-accent-dim">
                        {cafe.name}
                      </h3>
                      <p className="shrink-0 text-sm font-medium text-ink-100">
                        {formatMnt(cafe.pricePerHour)}
                        <span className="text-ink-500">{t("home.perHour")}</span>
                      </p>
                    </div>
                    <p className="text-xs text-ink-500">
                      {t("home.pcs", { n: cafe.pcCount ?? 0 })}
                      {cafe.district ? ` · ${districtLabel(cafe.district, locale)}` : ""}
                      {typeof cafe.distanceKm === "number" ? (
                        <span className="text-accent">
                          {" · "}
                          {t("map.distance", { n: cafe.distanceKm.toFixed(1) })}
                        </span>
                      ) : null}
                    </p>
                    {blurb ? (
                      <p className="line-clamp-2 text-sm leading-relaxed text-ink-300">
                        {blurb}
                      </p>
                    ) : null}
                    <p className="pt-1 text-sm text-ink-100 opacity-80 transition group-hover:opacity-100">
                      {t("home.view")}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
