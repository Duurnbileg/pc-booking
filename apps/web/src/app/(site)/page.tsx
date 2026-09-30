"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { LocateFixed, X } from "lucide-react";
import { API_PATHS } from "@pc-booking/shared";
import { api } from "@/lib/api";
import type { Cafe } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";
import { useLocale } from "@/components/locale-provider";
import { SearchBar } from "@/components/search-bar";
import { CafeGridSkeleton } from "@/components/skeletons";
import { CafesMap } from "@/components/maps/cafes-map";
import { CafeCard } from "@/components/home/cafe-card";
import { HowItWorks, OwnerCta, StatsStrip } from "@/components/home/home-sections";
import {
  getCurrentPosition,
  type LatLng,
} from "@/components/maps/maps-provider";

const RADIUS_OPTIONS = [1, 3, 5, 10, 20];

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (isAdmin) router.replace("/admin");
  }, [isAdmin, router]);

  return isAdmin ? null : <HomeContent />;
}

function HomeContent() {
  const { t } = useLocale();
  const [center, setCenter] = useState<LatLng | null>(null);
  const [radiusKm, setRadiusKm] = useState(5);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

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
    <div className="space-y-14">
      <section className="relative z-10 -mx-4 -mt-8 px-4 pb-4 pt-14 sm:pt-20">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="bg-grid absolute inset-0" />
          <div className="absolute left-1/2 top-0 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-accent/15 blur-3xl" />
        </div>

        <div className="mx-auto max-w-5xl space-y-6 text-center">
          <h1 className="text-balance bg-gradient-to-r from-accent via-emerald-300 to-sky-400 bg-clip-text pb-2 font-display text-5xl font-bold leading-tight tracking-tight text-transparent sm:text-7xl">
            {t("home.heroTitle")}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-ink-300 sm:text-xl">{t("home.tagline")}</p>
        </div>

        <div className="mx-auto mt-8 max-w-4xl space-y-4">
          <SearchBar />
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={locateMe}
              disabled={locating}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition disabled:opacity-60",
                center
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-ink-700 bg-ink-900/60 text-ink-100 hover:border-accent hover:text-accent",
              )}
            >
              <LocateFixed className={cn("h-4 w-4", locating && "animate-pulse")} />
              {locating ? t("map.locating") : t("map.nearMe")}
            </button>
            <label className="inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-900/60 py-1 pl-4 pr-1 text-sm text-ink-300">
              {t("map.radius")}
              <select
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="rounded-full bg-ink-800 px-3 py-1 text-ink-100"
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
                className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm text-ink-500 hover:text-ink-100"
              >
                <X className="h-4 w-4" />
                {t("map.clear")}
              </button>
            ) : null}
          </div>
          {geoError ? (
            <p className="text-center text-sm text-status-reserved">{geoError}</p>
          ) : null}
        </div>
      </section>

      <StatsStrip cafes={cafes} loading={isLoading} />

      <section className="space-y-5">
        {center ? (
          <h2 className="font-display text-2xl text-ink-100">
            {t("map.nearResults", { r: radiusKm })}
          </h2>
        ) : null}

        {isLoading ? (
          <CafeGridSkeleton count={6} />
        ) : error ? (
          <p className="text-status-reserved">{t("home.loadError")}</p>
        ) : cafes.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-ink-700 p-8 text-center text-ink-500">
            {t("home.empty")}
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cafes.map((cafe) => (
              <CafeCard key={cafe.id} cafe={cafe} />
            ))}
          </div>
        )}
      </section>

      {cafes.length > 0 || center ? (
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="font-display text-2xl text-ink-100">{t("home.mapTitle")}</h2>
            <p className="text-sm text-ink-500">{t("home.mapHint")}</p>
          </div>
          <CafesMap
            cafes={cafes}
            center={center}
            radiusKm={radiusKm}
            onPickCenter={setCenter}
            className="h-[420px]"
          />
        </section>
      ) : null}

      <HowItWorks />

      <OwnerCta />
    </div>
  );
}
