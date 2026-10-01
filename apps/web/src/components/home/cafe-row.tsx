"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import type { Cafe } from "@/lib/types";
import { cn, districtLabel, formatMnt } from "@/lib/utils";
import { useLocale } from "@/components/locale-provider";
import { CafeCoverFallback, ImageWithSkeleton } from "@/components/image-with-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { cafeLatLng, haversineKm, type LatLng } from "@/components/maps/maps-provider";

const TILE_WIDTH =
  "w-[70%] sm:w-[calc((100%-2*1rem)/3)] md:w-[calc((100%-3*1rem)/4)] lg:w-[calc((100%-4*1rem)/5)]";

type CafeRowProps = {
  title: string;
  href: string;
  cafes: Cafe[];
  loading: boolean;
  /** Shown instead of the row when there is nothing to list. */
  emptyMessage?: string | null;
  /** User's position; each card shows its distance from here. */
  origin?: LatLng | null;
};

export function CafeRow({ title, href, cafes, loading, emptyMessage, origin }: CafeRowProps) {
  const { t } = useLocale();
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setCanPrev(track.scrollLeft > 4);
    setCanNext(track.scrollLeft + track.clientWidth < track.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    window.addEventListener("resize", updateArrows);
    return () => window.removeEventListener("resize", updateArrows);
  }, [cafes, loading, updateArrows]);

  function scroll(direction: 1 | -1) {
    trackRef.current?.scrollBy({
      left: direction * trackRef.current.clientWidth * 0.9,
      behavior: "smooth",
    });
  }

  const showEmpty = !loading && (emptyMessage || cafes.length === 0);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={href}
          title={t("home.viewAllCafes")}
          className="group inline-flex items-center gap-2 font-display text-xl font-semibold text-ink-100"
        >
          {title}
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-800 transition group-hover:bg-accent group-hover:text-ink-950">
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
        {!showEmpty ? (
          <div className="hidden gap-2 sm:flex">
            <RowArrow side="left" disabled={!canPrev} onClick={() => scroll(-1)} />
            <RowArrow side="right" disabled={!canNext} onClick={() => scroll(1)} />
          </div>
        ) : null}
      </div>

      {showEmpty ? (
        <p className="rounded-2xl border border-dashed border-ink-700 p-6 text-center text-sm text-ink-500">
          {emptyMessage || t("home.empty")}
        </p>
      ) : (
        <div
          ref={trackRef}
          onScroll={updateArrows}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {loading
            ? Array.from({ length: 5 }, (_, i) => (
                <div key={i} className={cn("shrink-0 space-y-2", TILE_WIDTH)}>
                  <Skeleton className="aspect-square w-full rounded-2xl" />
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))
            : cafes.map((cafe) => (
                <CafeTile key={cafe.id} cafe={cafe} origin={origin} />
              ))}
        </div>
      )}
    </section>
  );
}

function CafeTile({ cafe, origin }: { cafe: Cafe; origin?: LatLng | null }) {
  const { t, locale } = useLocale();
  const cover = cafe.images?.[0];
  const available = cafe.availablePcs;
  const meta = cafe.district ? districtLabel(cafe.district, locale) : "";
  const position = cafeLatLng(cafe.location);
  const distanceKm =
    cafe.distanceKm ?? (origin && position ? haversineKm(origin, position) : undefined);

  return (
    <Link href={`/cafes/${cafe.slug}`} className={cn("group shrink-0 snap-start", TILE_WIDTH)}>
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-ink-800">
        {cover ? (
          <ImageWithSkeleton
            src={cover}
            alt={cafe.name}
            className="transition-[opacity,transform] duration-500 group-hover:scale-105"
            fallback={<CafeCoverFallback />}
          />
        ) : (
          <div className="absolute inset-0">
            <CafeCoverFallback />
          </div>
        )}
        {typeof available === "number" ? (
          <span
            className={cn(
              "absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-ink-950/85 px-2.5 py-1 text-xs font-medium backdrop-blur",
              available > 0 ? "text-status-available" : "text-status-reserved",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                available > 0 ? "bg-status-available" : "bg-status-reserved",
              )}
            />
            {available > 0 ? t("home.freeSeats", { n: available }) : t("home.full")}
          </span>
        ) : null}
        {distanceKm !== undefined ? (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-ink-950/85 px-2.5 py-1 text-xs font-medium text-ink-100 backdrop-blur tabular-nums">
            <MapPin className="h-3 w-3 text-accent" />
            {t("home.distanceShort", { n: distanceKm.toFixed(1) })}
          </span>
        ) : null}
      </div>
      <p className="mt-2.5 truncate font-medium text-ink-100 group-hover:text-accent">
        {cafe.name}
      </p>
      <p className="truncate text-sm text-ink-500">
        <span className="text-ink-300">
          {formatMnt(cafe.pricePerHour)}
          {t("home.perHour")}
        </span>
        {meta ? ` · ${meta}` : ""}
      </p>
    </Link>
  );
}

function RowArrow({
  side,
  disabled,
  onClick,
}: {
  side: "left" | "right";
  disabled: boolean;
  onClick: () => void;
}) {
  const { t } = useLocale();
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={t(side === "left" ? "home.scrollLeft" : "home.scrollRight")}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-ink-700 bg-ink-900 text-ink-100 transition hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-30"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
