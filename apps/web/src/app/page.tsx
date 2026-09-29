"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { API_PATHS } from "@pc-booking/shared";
import { api } from "@/lib/api";
import type { Cafe } from "@/lib/types";
import { districtLabel, formatMnt } from "@/lib/utils";
import { useLocale } from "@/components/locale-provider";
import { SearchBar } from "@/components/search-bar";
import { CafeGridSkeleton } from "@/components/skeletons";
import { CafeCoverFallback, ImageWithSkeleton } from "@/components/image-with-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

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

  const { data, isLoading, error } = useQuery({
    queryKey: ["cafes"],
    queryFn: () => api<{ cafes: Cafe[] }>(API_PATHS.cafes.list),
  });

  const cafes = data?.cafes ?? [];

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <p className="font-display text-4xl sm:text-5xl tracking-tight text-ink-100">
          PC<span className="text-accent">Book</span>
        </p>
        <h1 className="text-xl text-ink-300 max-w-xl">{t("home.tagline")}</h1>
        <SearchBar />
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl text-ink-100">{t("home.subtitleDefault")}</h2>
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
