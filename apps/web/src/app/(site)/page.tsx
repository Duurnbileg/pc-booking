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
import { CafesMap } from "@/components/maps/cafes-map";
import { CafeRow } from "@/components/home/cafe-row";
import { OwnerCta } from "@/components/home/home-sections";
import {
  getCurrentPosition,
  type LatLng,
} from "@/components/maps/maps-provider";

/** The API's maximum radius — the row just lists the closest cafes, nearest first. */
const NEARBY_RADIUS_KM = 50;
const ROW_LIMIT = 10;

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
        limit: String(ROW_LIMIT),
      });
      return api<{ cafes: Cafe[] }>(`${API_PATHS.cafes.list}?${params}`);
    },
    enabled: center !== null,
  });

  const cheapest = useQuery({
    queryKey: ["cafes", "cheapest"],
    queryFn: () => {
      const params = new URLSearchParams({ sort: "price_asc", limit: String(ROW_LIMIT) });
      return api<{ cafes: Cafe[] }>(`${API_PATHS.cafes.list}?${params}`);
    },
  });

  return (
    <div className="space-y-14">
      <section className="relative z-10 -mx-4 -mt-8 px-4 pb-2 pt-8 sm:pt-10">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="bg-grid absolute inset-0" />
          <div className="absolute left-1/2 top-0 h-48 w-[42rem] -translate-x-1/2 rounded-full bg-accent/15 blur-3xl" />
        </div>

        <h1 className="sr-only">{t("home.heroTitle")}</h1>
        <div className="mx-auto max-w-4xl">
          <SearchBar />
        </div>
      </section>

      <div className="space-y-10">
        <CafeRow
          title={t("map.nearResults")}
          href="/search"
          cafes={nearby.data?.cafes ?? []}
          loading={!geoError && (locating || nearby.isLoading)}
          origin={center}
          emptyMessage={
            geoError === "unsupported"
              ? t("map.geoUnsupported")
              : geoError
                ? t("map.needLocation")
                : nearby.error
                  ? t("home.loadError")
                  : nearby.data?.cafes.length === 0
                    ? t("map.nearEmpty")
                    : null
          }
        />

        <CafeRow
          title={t("home.cheapestTitle")}
          href="/search?sort=price_asc"
          cafes={cheapest.data?.cafes ?? []}
          loading={cheapest.isLoading}
          origin={center}
          emptyMessage={cheapest.error ? t("home.loadError") : null}
        />
      </div>

      {allCafes.data?.cafes.length ? (
        <section className="space-y-4">
          <h2 className="font-display text-2xl text-ink-100">{t("home.mapTitle")}</h2>
          <CafesMap cafes={allCafes.data.cafes} center={center} className="h-[420px]" />
        </section>
      ) : null}

      <OwnerCta />
    </div>
  );
}
