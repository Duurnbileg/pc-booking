"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  ArrowUpRight,
  Headphones,
  MapPin,
  Phone,
  type LucideIcon,
} from "lucide-react";
import { API_PATHS } from "@pc-booking/shared";
import { api } from "@/lib/api";
import type { Cafe } from "@/lib/types";
import { districtLabel } from "@/lib/utils";
import { useLocale } from "@/components/locale-provider";
import { PcSeatMap } from "@/components/pc-seat-map";
import { CafePricingCards } from "@/components/cafe-pricing-cards";
import { CafeGallery } from "@/components/cafe-gallery";
import { CafeDetailSkeleton } from "@/components/skeletons";
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
  const address = cafe.address.replace(/^\s*хаяг\s*:\s*/i, "").trim();
  const gearItems = (cafe.gear ?? "")
    .split(/[,·•\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <Link href="/" className="text-sm text-ink-500 hover:text-ink-300">
          {t("cafe.backDiscover")}
        </Link>
        <h1 className="font-display text-4xl tracking-tight">{cafe.name}</h1>
        {cafe.district ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
            <MapPin className="h-3 w-3" />
            {districtLabel(cafe.district, locale)}
          </span>
        ) : null}
        {cafe.description ? (
          <p className="max-w-3xl whitespace-pre-line text-base leading-relaxed text-ink-100 sm:text-lg">
            {cafe.description}
          </p>
        ) : null}
        {address || gearItems.length ? (
          <div className="grid max-w-3xl gap-3 pt-1 sm:grid-cols-2">
            {address ? (
              <InfoCard
                icon={MapPin}
                label={t("cafe.address")}
                href={position ? directionsUrl(position) : undefined}
              >
                <p className="text-sm font-medium leading-snug text-ink-100">{address}</p>
              </InfoCard>
            ) : null}
            {gearItems.length ? (
              <InfoCard icon={Headphones} label={t("cafe.gearLabel")}>
                <ul className="flex flex-wrap gap-1.5">
                  {gearItems.map((item) => (
                    <li
                      key={item}
                      className="rounded-full border border-ink-700 bg-ink-950/60 px-2.5 py-1 text-xs text-ink-100"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </InfoCard>
            ) : null}
          </div>
        ) : null}
        {cafe.phone ? (
          <div className="pt-2">
            <a
              href={`tel:${cafe.phone.replace(/\s+/g, "")}`}
              className="group inline-flex items-center gap-3 rounded-2xl border border-ink-800 bg-ink-900/60 py-3 pl-3 pr-6 transition duration-300 hover:-translate-y-0.5 hover:border-accent/40"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent transition duration-300 group-hover:bg-accent/20">
                <Phone className="h-5 w-5" />
              </span>
              <span className="flex flex-col gap-0.5 leading-tight">
                <span className="text-xs uppercase tracking-wider text-ink-500">
                  {t("cafe.call")}
                </span>
                <span className="font-display text-xl font-semibold tracking-wide text-ink-100">
                  {cafe.phone}
                </span>
              </span>
            </a>
          </div>
        ) : null}
        {cafe.images?.length ? (
          <div className="pt-4">
            <CafeGallery images={cafe.images} />
          </div>
        ) : null}
        <div className="pt-2">
          <CafePricingCards cafe={cafe} />
        </div>
        <div className="pt-2">
          <PcSeatMap cafe={cafe} />
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
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="max-w-3xl text-base leading-relaxed text-ink-100 sm:text-lg">
              {address}
            </p>
            <a
              href={directionsUrl(position)}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-sm text-accent hover:underline"
            >
              {t("map.directions")}
            </a>
          </div>
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

function InfoCard({
  icon: Icon,
  label,
  href,
  children,
}: {
  icon: LucideIcon;
  label: string;
  href?: string;
  children: ReactNode;
}) {
  const body = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent transition group-hover:bg-accent group-hover:text-ink-950">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1 space-y-1.5">
        <span className="block text-xs uppercase tracking-wider text-ink-500">{label}</span>
        {children}
      </div>
      {href ? (
        <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-500 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
      ) : null}
    </>
  );
  const className =
    "group flex items-start gap-3 rounded-2xl border border-ink-800 bg-ink-900/60 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-[0_12px_40px_rgba(61,220,151,0.1)]";

  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {body}
    </a>
  ) : (
    <div className={className}>{body}</div>
  );
}
