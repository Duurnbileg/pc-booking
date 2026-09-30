"use client";

import Link from "next/link";
import { ArrowRight, MapPin, Monitor, Navigation } from "lucide-react";
import type { Cafe } from "@/lib/types";
import { districtLabel, formatMnt } from "@/lib/utils";
import { useLocale } from "@/components/locale-provider";
import { CafeCoverFallback, ImageWithSkeleton } from "@/components/image-with-skeleton";

function cafeBlurb(cafe: Cafe): string {
  const parts: string[] = [];
  if (cafe.address) parts.push(cafe.address);
  if (cafe.gear) parts.push(cafe.gear);
  if (cafe.displaySpecs) parts.push(cafe.displaySpecs);
  if (!parts.length && cafe.description) return cafe.description;
  return parts.join(" · ");
}

export function CafeCard({ cafe }: { cafe: Cafe }) {
  const { t, locale } = useLocale();
  const cover = cafe.images?.[0];
  const blurb = cafeBlurb(cafe);
  const district = cafe.district ? districtLabel(cafe.district, locale) : "";

  return (
    <Link
      href={`/cafes/${cafe.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-ink-800 bg-ink-900/60 shadow-[0_12px_40px_rgba(0,0,0,0.25)] transition duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-[0_20px_50px_rgba(61,220,151,0.12)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-ink-800">
        {cover ? (
          <ImageWithSkeleton
            src={cover}
            alt={cafe.name}
            className="transition-[opacity,transform] duration-500 group-hover:scale-[1.05]"
            fallback={<CafeCoverFallback />}
          />
        ) : (
          <CafeCoverFallback />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/10 to-transparent" />

        <span className="absolute right-3 top-3 rounded-full bg-ink-950/80 px-3 py-1 text-sm font-semibold text-accent ring-1 ring-accent/30 backdrop-blur">
          {formatMnt(cafe.pricePerHour)}
          <span className="font-normal text-ink-300">{t("home.perHour")}</span>
        </span>
        {typeof cafe.distanceKm === "number" ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-sky-500/90 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
            <Navigation className="h-3 w-3" />
            {t("map.distance", { n: cafe.distanceKm.toFixed(1) })}
          </span>
        ) : null}

        <h3 className="absolute inset-x-4 bottom-3 truncate font-display text-xl font-semibold text-white drop-shadow">
          {cafe.name}
        </h3>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-700 bg-ink-800/60 px-2.5 py-1 text-ink-100">
            <Monitor className="h-3.5 w-3.5 text-accent" />
            {t("home.pcs", { n: cafe.pcCount ?? 0 })}
          </span>
          {district ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-700 bg-ink-800/60 px-2.5 py-1 text-ink-100">
              <MapPin className="h-3.5 w-3.5 text-accent" />
              {district}
            </span>
          ) : null}
        </div>
        {blurb ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-ink-300">{blurb}</p>
        ) : null}
        <span className="mt-auto inline-flex items-center gap-1 pt-1 text-sm font-medium text-ink-100 transition group-hover:text-accent">
          {t("home.details")}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
