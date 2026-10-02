"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  Check,
  Clock,
  Cpu,
  Headphones,
  Navigation,
  Phone,
  Share,
  type LucideIcon,
} from "lucide-react";
import { API_PATHS } from "@pc-booking/shared";
import { api } from "@/lib/api";
import type { Cafe } from "@/lib/types";
import { cafeSeatStats } from "@/lib/mock-seats";
import { cn, districtLabel, formatMnt } from "@/lib/utils";
import { useLocale } from "@/components/locale-provider";
import { PcSeatMap } from "@/components/pc-seat-map";
import { CafePricingCards } from "@/components/cafe-pricing-cards";
import { CafePhotoGrid } from "@/components/cafe-photo-grid";
import { AvailabilityBadge } from "@/components/availability-badge";
import { CafeDetailSkeleton } from "@/components/skeletons";
import { cafeLatLng, directionsUrl, type LatLng } from "@/components/maps/maps-provider";

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
  const { hall, vip } = cafe.pricing;
  const minPrice = Math.min(hall.price, vip?.price ?? Infinity);
  const { total: totalPcs, available: availablePcs } = cafeSeatStats(cafe);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link href="/" className="text-sm text-ink-500 hover:text-ink-300">
          {t("cafe.backDiscover")}
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-3xl tracking-tight sm:text-4xl">{cafe.name}</h1>
          <ShareButton title={cafe.name} />
        </div>
      </div>

      <CafePhotoGrid images={cafe.images ?? []} name={cafe.name} />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14">
        <aside className="lg:order-last">
          <div className="lg:sticky lg:top-24">
            <BookingCard
              cafe={cafe}
              minPrice={minPrice}
              totalPcs={totalPcs}
              availablePcs={availablePcs}
              position={position}
              address={address}
            />
          </div>
        </aside>

        <div className="min-w-0 divide-y divide-ink-800 [&>*:first-child]:pt-0 [&>*]:py-8">
          <section className="space-y-5">
            <div className="space-y-1">
              <h2 className="font-display text-2xl text-ink-100">
                {cafe.district
                  ? t("cafe.subtitle", { district: districtLabel(cafe.district, locale) })
                  : t("cafe.subtitleNoDistrict")}
              </h2>
              <p className="text-ink-300">
                {[
                  t("home.pcs", { n: totalPcs }),
                  t("cafe.hall"),
                  vip ? t("cafe.vip") : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <HighlightStats minPrice={minPrice} totalPcs={totalPcs} availablePcs={availablePcs} />
          </section>

          <FeatureList cafe={cafe} />

          {cafe.description ? (
            <section className="space-y-3">
              <h2 className="font-display text-xl text-ink-100">{t("cafe.about")}</h2>
              <CafeDescription text={cafe.description} />
            </section>
          ) : null}

          <section className="space-y-4">
            <h2 className="font-display text-xl text-ink-100">{t("cafe.pricing")}</h2>
            <CafePricingCards cafe={cafe} />
          </section>

          <div>
            <PcSeatMap cafe={cafe} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ShareButton({ title }: { title: string }) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // Dismissed or unsupported target; fall back to copying.
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
  }

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-100 underline-offset-4 transition hover:bg-ink-900 hover:underline"
    >
      {copied ? <Check className="h-4 w-4 text-status-available" /> : <Share className="h-4 w-4" />}
      {copied ? t("cafe.linkCopied") : t("cafe.share")}
    </button>
  );
}

function HighlightStats({
  minPrice,
  totalPcs,
  availablePcs: available,
}: {
  minPrice: number;
  totalPcs: number;
  availablePcs: number | null;
}) {
  const { t } = useLocale();
  const stats: { value: string; label: string; tone?: string }[] = [
    ...(typeof available === "number"
      ? [
          {
            value: `${available}/${totalPcs}`,
            label: t("cafe.statFree"),
            tone: available > 0 ? "text-status-available" : "text-status-reserved",
          },
        ]
      : []),
    { value: String(totalPcs), label: t("cafe.statTotal") },
    { value: formatMnt(minPrice), label: t("cafe.statPrice") },
  ];

  return (
    <div
      className="grid divide-x divide-ink-800 rounded-2xl border border-ink-800 bg-ink-900/60 py-4"
      style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}
    >
      {stats.map(({ value, label, tone }) => (
        <div key={label} className="px-3 text-center">
          <p className={cn("font-display text-xl font-semibold tabular-nums text-ink-100", tone)}>
            {value}
          </p>
          <p className="mt-0.5 text-xs text-ink-500">{label}</p>
        </div>
      ))}
    </div>
  );
}

function hoursFeature(cafe: Cafe, t: ReturnType<typeof useLocale>["t"]) {
  const days = cafe.openingHours ?? [];
  if (!days.length || days.some((d) => d.closed)) return null;
  const is247 = days.every((d) => d.open === "00:00" && (d.close === "23:59" || d.close === "24:00"));
  if (is247) return { title: t("cafe.open247"), text: t("cafe.open247Hint") };
  const [first] = days;
  const uniform = days.every((d) => d.open === first!.open && d.close === first!.close);
  return uniform
    ? { title: t("cafe.hours"), text: t("cafe.hoursDaily", { open: first!.open, close: first!.close }) }
    : null;
}

function FeatureList({ cafe }: { cafe: Cafe }) {
  const { t } = useLocale();
  const best = cafe.pricing.vip ?? cafe.pricing.hall;
  const specs = [best.gpu, best.cpu, best.ram, best.monitor]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(" · ");
  const gear = (cafe.gear ?? "")
    .split(/[,·•\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .join(" · ");
  const hours = hoursFeature(cafe, t);

  const items: { icon: LucideIcon; title: string; text: string }[] = [
    ...(hours ? [{ icon: Clock, ...hours }] : []),
    ...(specs ? [{ icon: Cpu, title: t("cafe.topSpecs"), text: specs }] : []),
    ...(gear ? [{ icon: Headphones, title: t("cafe.gearLabel"), text: gear }] : []),
  ];

  if (!items.length) return null;

  return (
    <ul className="space-y-5">
      {items.map(({ icon: Icon, title, text }) => (
        <li key={title} className="flex gap-4">
          <Icon className="mt-0.5 h-6 w-6 shrink-0 text-ink-300" />
          <div className="min-w-0">
            <p className="font-medium text-ink-100">{title}</p>
            <p className="text-sm text-ink-500">{text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function BookingCard({
  cafe,
  minPrice,
  totalPcs,
  availablePcs,
  position,
  address,
}: {
  cafe: Cafe;
  minPrice: number;
  totalPcs: number;
  availablePcs: number | null;
  position: LatLng | null;
  address: string;
}) {
  const { t } = useLocale();

  return (
    <div className="space-y-5 rounded-2xl border border-ink-800 bg-ink-900/70 p-6 shadow-[0_16px_48px_rgba(0,0,0,0.35)]">
      <div className="space-y-2">
        <p className="text-ink-300">
          <span className="font-display text-2xl font-semibold text-ink-100">
            {t("cafe.priceFrom", { price: formatMnt(minPrice) })}
          </span>{" "}
          {t("home.perHour")}
        </p>
        <AvailabilityBadge available={availablePcs} total={totalPcs} />
      </div>

      <div className="space-y-2">
        <a
          href="#seats"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById("seats")?.scrollIntoView({ behavior: "smooth" });
          }}
          className="block w-full rounded-xl bg-accent py-3 text-center font-medium text-ink-950 transition hover:bg-accent-dim"
        >
          {t("booking.pickSeats")}
        </a>
        <p className="text-center text-xs text-ink-500">{t("booking.pickSeatsHint")}</p>
      </div>

      {cafe.phone || position ? (
        <div className="grid gap-2 border-t border-ink-800 pt-5">
          {cafe.phone ? (
            <ContactButton href={`tel:${cafe.phone.replace(/[^\d+]/g, "")}`} label={t("cafe.call")}>
              <Phone className="h-4 w-4" />
              {cafe.phone.replace(/^(\d{4})[\s-]?(\d{4})$/, "$1 $2")}
            </ContactButton>
          ) : null}
          {position ? (
            <ContactButton href={directionsUrl(position)} external title={address || undefined}>
              <Navigation className="h-4 w-4" />
              {t("cafe.directions")}
            </ContactButton>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ContactButton({
  href,
  external,
  label,
  title,
  children,
}: {
  href: string;
  external?: boolean;
  label?: string;
  title?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      title={title}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-4 py-2.5 text-sm font-medium text-accent transition hover:bg-accent hover:text-ink-950"
    >
      {children}
    </a>
  );
}

function CafeDescription({ text }: { text: string }) {
  const { t } = useLocale();
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const [syncedText, setSyncedText] = useState(text);
  if (text !== syncedText) {
    setSyncedText(text);
    setExpanded(false);
  }

  useLayoutEffect(() => {
    const el = ref.current;
    if (el && !expanded) setOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [text, expanded]);

  return (
    <div className="space-y-1">
      <p
        ref={ref}
        className={cn(
          "whitespace-pre-line leading-relaxed text-ink-100",
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
