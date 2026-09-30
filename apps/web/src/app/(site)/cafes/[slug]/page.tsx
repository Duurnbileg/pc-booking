"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { API_PATHS, type OpeningHours } from "@pc-booking/shared";
import { api } from "@/lib/api";
import type { Cafe } from "@/lib/types";
import { cn, districtLabel, formatMnt } from "@/lib/utils";
import { useLocale } from "@/components/locale-provider";
import { PcSeatMap } from "@/components/pc-seat-map";
import { CafeDetailSkeleton } from "@/components/skeletons";
import { ImageWithSkeleton } from "@/components/image-with-skeleton";
import { cafeLatLng } from "@/components/maps/maps-provider";
import {
  CafeLocationMap,
  directionsUrl,
} from "@/components/maps/cafe-location-map";

export default function CafeDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { t, locale } = useLocale();

  const cafeQuery = useQuery({
    queryKey: ["cafe", slug],
    queryFn: () => api<{ cafe: Cafe }>(API_PATHS.cafes.byId(slug)),
  });

  if (cafeQuery.isLoading) {
    return <CafeDetailSkeleton />;
  }

  if (cafeQuery.error || !cafeQuery.data?.cafe) {
    return (
      <div className="space-y-3">
        <p className="text-status-reserved">{t("cafe.notFound")}</p>
        <Link href="/" className="text-accent hover:underline">
          {t("cafe.backHome")}
        </Link>
      </div>
    );
  }

  const cafe = cafeQuery.data.cafe;
  const position = cafeLatLng(cafe.location);

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <Link href="/" className="text-sm text-ink-500 hover:text-ink-300">
          {t("cafe.backDiscover")}
        </Link>
        <h1 className="font-display text-4xl tracking-tight">{cafe.name}</h1>
        {cafe.openingHours?.length ? (
          <OpeningHoursBadges openingHours={cafe.openingHours} />
        ) : null}
        {cafe.description ? (
          <p className="max-w-2xl text-ink-300">{cafe.description}</p>
        ) : null}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-400">
          {cafe.district ? (
            <span className="text-accent">{districtLabel(cafe.district, locale)}</span>
          ) : null}
          <span>{cafe.address}</span>
          <a href={`tel:${cafe.phone}`} className="hover:text-accent">
            {cafe.phone}
          </a>
          <span>{t("home.pcs", { n: cafe.pcCount ?? 0 })}</span>
          <span className="text-accent font-medium">
            {formatMnt(cafe.pricePerHour)} {t("home.perHour")}
          </span>
        </div>
        {cafe.gear || cafe.displaySpecs ? (
          <div className="max-w-2xl space-y-1 text-sm text-ink-300">
            {cafe.gear ? (
              <p>
                <span className="text-ink-500">{t("cafe.gear")} </span>
                {cafe.gear}
              </p>
            ) : null}
            {cafe.displaySpecs ? (
              <p>
                <span className="text-ink-500">{t("cafe.specs")} </span>
                {cafe.displaySpecs}
              </p>
            ) : null}
          </div>
        ) : null}
        {cafe.images?.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 pt-2">
            {cafe.images.map((url) => (
              <div
                key={url}
                className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-ink-800 bg-ink-900"
              >
                <ImageWithSkeleton src={url} alt="" />
              </div>
            ))}
          </div>
        ) : null}
        <div className="pt-2">
          <PcSeatMap slug={cafe.slug} />
        </div>
        <button
          type="button"
          disabled
          className="mt-2 rounded-lg border border-ink-700 px-4 py-2 text-sm text-ink-500 cursor-not-allowed"
        >
          {t("cafe.bookSoon")}
        </button>
      </div>

      {position ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="font-display text-xl">{t("map.location")}</h2>
            <a
              href={directionsUrl(position)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-accent hover:underline"
            >
              {t("map.directions")}
            </a>
          </div>
          <p className="text-sm text-ink-400">{cafe.address}</p>
          <CafeLocationMap
            position={position}
            title={cafe.name}
            className="h-72"
          />
        </section>
      ) : null}

    </div>
  );
}

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

type HoursGroup = { days: number[]; hours: OpeningHours };

function sameHours(a: OpeningHours, b: OpeningHours): boolean {
  if (a.closed || b.closed) return Boolean(a.closed) === Boolean(b.closed);
  return a.open === b.open && a.close === b.close;
}

function groupHours(openingHours: OpeningHours[]): HoursGroup[] {
  const byDay = new Map(openingHours.map((h) => [h.day, h]));
  const groups: HoursGroup[] = [];
  for (const day of WEEK_ORDER) {
    const hours = byDay.get(day);
    if (!hours) continue;
    const last = groups[groups.length - 1];
    const prevDay = last?.days[last.days.length - 1];
    const consecutive =
      prevDay !== undefined && WEEK_ORDER.indexOf(prevDay) === WEEK_ORDER.indexOf(day) - 1;
    if (last && consecutive && sameHours(last.hours, hours)) {
      last.days.push(day);
    } else {
      groups.push({ days: [day], hours });
    }
  }
  return groups;
}

function OpeningHoursBadges({ openingHours }: { openingHours: OpeningHours[] }) {
  const { t, days } = useLocale();
  const groups = groupHours(openingHours);
  if (!groups.length) return null;

  const everyDay = groups.length === 1 && groups[0].days.length === 7;
  const dayLabel = (group: HoursGroup) => {
    if (everyDay) return t("cafe.everyDay");
    const first = days[group.days[0]];
    const last = days[group.days[group.days.length - 1]];
    return group.days.length > 1 ? `${first}–${last}` : first;
  };

  return (
    <div className="flex flex-wrap gap-2" aria-label={t("cafe.hours")}>
      {groups.map((group) => (
        <span
          key={group.days.join("-")}
          title={t("cafe.hours")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs",
            group.hours.closed
              ? "border-status-reserved/40 bg-status-reserved/10 text-status-reserved"
              : "border-ink-700 bg-ink-900/60 text-ink-300",
          )}
        >
          <ClockIcon />
          <span className="font-medium text-ink-100">{dayLabel(group)}</span>
          {group.hours.closed
            ? t("cafe.closed")
            : `${group.hours.open}–${group.hours.close}`}
        </span>
      ))}
    </div>
  );
}

function ClockIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
