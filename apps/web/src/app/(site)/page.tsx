"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { API_PATHS } from "@pc-booking/shared";
import { api } from "@/lib/api";
import type { Cafe } from "@/lib/types";
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

const NEARBY_RADIUS_KM = 1;
const NEARBY_LIMIT = 6;

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
  const [locating, setLocating] = useState(true);
  const [geoError, setGeoError] = useState<"unsupported" | "denied" | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCurrentPosition()
      .then((pos) => {
        if (!cancelled) setCenter(pos);
      })
      .catch((err) => {
        if (cancelled) return;
        setGeoError(err instanceof Error && err.message === "unsupported" ? "unsupported" : "denied");
      })
      .finally(() => {
        if (!cancelled) setLocating(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const allCafes = useQuery({
    queryKey: ["cafes"],
    queryFn: () => api<{ cafes: Cafe[] }>(API_PATHS.cafes.list),
  });

  const nearby = useQuery({
    queryKey: ["cafes", "nearby", center?.lat, center?.lng],
    queryFn: () => {
      const params = new URLSearchParams({
        lat: String(center!.lat),
        lng: String(center!.lng),
        radiusKm: String(NEARBY_RADIUS_KM),
        limit: String(NEARBY_LIMIT),
      });
      return api<{ cafes: Cafe[] }>(`${API_PATHS.cafes.list}?${params}`);
    },
    enabled: center !== null,
  });

  const cafes = nearby.data?.cafes ?? [];
  const loadingNearby = locating || nearby.isLoading;

  return (
    <div className="space-y-14">
      <section className="relative z-10 -mx-4 -mt-8 px-4 pb-4 pt-14 sm:pt-20">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="bg-grid absolute inset-0" />
          <div className="absolute left-1/2 top-0 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-accent/15 blur-3xl" />
        </div>

        <div className="mx-auto max-w-5xl space-y-6 text-center">
          <h1 className="text-balance bg-gradient-to-r from-accent via-sky-300 to-indigo-300 bg-clip-text pb-2 font-display text-5xl font-bold leading-tight tracking-tight text-transparent sm:text-7xl">
            {t("home.heroTitle")}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-ink-300 sm:text-xl">{t("home.tagline")}</p>
        </div>

        <div className="mx-auto mt-8 max-w-4xl">
          <SearchBar />
        </div>
      </section>

      <StatsStrip cafes={allCafes.data?.cafes ?? []} loading={allCafes.isLoading} />

      <section className="space-y-5">
        <h2 className="font-display text-2xl text-ink-100">
          {t("map.nearResults", { r: NEARBY_RADIUS_KM })}
        </h2>

        {geoError ? (
          <p className="rounded-2xl border border-dashed border-ink-700 p-8 text-center text-ink-500">
            {geoError === "unsupported" ? t("map.geoUnsupported") : t("map.needLocation")}
          </p>
        ) : loadingNearby ? (
          <CafeGridSkeleton count={NEARBY_LIMIT} />
        ) : nearby.error ? (
          <p className="text-status-reserved">{t("home.loadError")}</p>
        ) : cafes.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-ink-700 p-8 text-center text-ink-500">
            {t("map.nearEmpty", { r: NEARBY_RADIUS_KM })}
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cafes.map((cafe) => (
              <CafeCard key={cafe.id} cafe={cafe} />
            ))}
          </div>
        )}
      </section>

      {allCafes.data?.cafes.length ? (
        <section className="space-y-4">
          <h2 className="font-display text-2xl text-ink-100">{t("home.mapTitle")}</h2>
          <CafesMap
            cafes={allCafes.data.cafes}
            center={center}
            radiusKm={NEARBY_RADIUS_KM}
            className="h-[420px]"
          />
        </section>
      ) : null}

      <HowItWorks />

      <OwnerCta />
    </div>
  );
}
