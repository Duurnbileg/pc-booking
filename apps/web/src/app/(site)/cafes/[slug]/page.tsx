"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  Headphones,
  MapPin,
  Navigation,
  Phone,
  type LucideIcon,
} from "lucide-react";
import { API_PATHS } from "@pc-booking/shared";
import { api } from "@/lib/api";
import type { Cafe } from "@/lib/types";
import { cn, districtLabel } from "@/lib/utils";
import { useLocale } from "@/components/locale-provider";
import { PcSeatMap } from "@/components/pc-seat-map";
import { CafePricingCards } from "@/components/cafe-pricing-cards";
import { CafeGallery } from "@/components/cafe-gallery";
import { CafeDetailSkeleton } from "@/components/skeletons";
import { cafeLatLng, directionsUrl } from "@/components/maps/maps-provider";

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
    <div className="space-y-6">
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
        {cafe.description ? <CafeDescription text={cafe.description} /> : null}
      </div>

      <div className="space-y-4">
        {address || cafe.phone || gearItems.length ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {address ? (
              <InfoCard
                icon={MapPin}
                label={t("cafe.address")}
                href={position ? directionsUrl(position) : undefined}
                external
                className={cafe.phone ? undefined : "sm:col-span-2"}
              >
                <p
                  title={address}
                  className="truncate text-sm font-medium leading-snug text-ink-100"
                >
                  {address}
                </p>
                {position ? (
                  <span className="inline-flex items-center gap-1 pt-1 text-sm font-medium text-accent">
                    <Navigation className="h-3.5 w-3.5" />
                    {t("cafe.openInMaps")}
                  </span>
                ) : null}
              </InfoCard>
            ) : null}
            {cafe.phone ? (
              <InfoCard
                icon={Phone}
                label={t("cafe.call")}
                href={`tel:${cafe.phone.replace(/[^\d+]/g, "")}`}
                className={address ? undefined : "sm:col-span-2"}
              >
                <p className="font-display text-xl font-semibold tracking-wide text-ink-100">
                  {cafe.phone.replace(/^(\d{4})[\s-]?(\d{4})$/, "$1 $2")}
                </p>
              </InfoCard>
            ) : null}
            {gearItems.length ? (
              <InfoCard icon={Headphones} label={t("cafe.gearLabel")} className="sm:col-span-2">
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
        {cafe.images?.length ? <CafeGallery images={cafe.images} /> : null}
        <CafePricingCards cafe={cafe} />
        <PcSeatMap cafe={cafe} />
        <button
          type="button"
          disabled
          className="cursor-not-allowed rounded-lg border border-ink-700 px-4 py-2 text-sm text-ink-500"
        >
          {t("cafe.bookSoon")}
        </button>
      </div>
    </div>
  );
}

function CafeDescription({ text }: { text: string }) {
  const { t } = useLocale();
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el && !expanded) setOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [text, expanded]);

  return (
    <div className="max-w-3xl space-y-1">
      <p
        ref={ref}
        className={cn(
          "whitespace-pre-line text-base leading-relaxed text-ink-100 sm:text-lg",
          !expanded && "line-clamp-5",
        )}
      >
        {text}
      </p>
      {overflowing ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-sm font-medium text-accent hover:underline"
        >
          {expanded ? t("cafe.showLess") : t("cafe.showMore")}
        </button>
      ) : null}
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  href,
  external,
  className: extraClassName,
  children,
}: {
  icon: LucideIcon;
  label: string;
  href?: string;
  external?: boolean;
  className?: string;
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
  const className = cn(
    "group flex items-start gap-3 rounded-2xl border border-ink-800 bg-ink-900/60 p-4 transition duration-300",
    href && "hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-[0_12px_40px_rgba(79,157,255,0.1)]",
    extraClassName,
  );

  return href ? (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={className}
    >
      {body}
    </a>
  ) : (
    <div className={className}>{body}</div>
  );
}
