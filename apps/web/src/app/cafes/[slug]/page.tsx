"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { API_PATHS } from "@pc-booking/shared";
import { api } from "@/lib/api";
import type { Cafe } from "@/lib/types";
import { formatMnt } from "@/lib/utils";
import { useLocale } from "@/components/locale-provider";

export default function CafeDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { t, days } = useLocale();

  const cafeQuery = useQuery({
    queryKey: ["cafe", slug],
    queryFn: () => api<{ cafe: Cafe }>(API_PATHS.cafes.byId(slug)),
  });

  if (cafeQuery.isLoading) {
    return <p className="text-ink-500">{t("common.loading")}</p>;
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

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <Link href="/" className="text-sm text-ink-500 hover:text-ink-300">
          {t("cafe.backDiscover")}
        </Link>
        <h1 className="font-display text-4xl tracking-tight">{cafe.name}</h1>
        {cafe.description ? (
          <p className="max-w-2xl text-ink-300">{cafe.description}</p>
        ) : null}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-400">
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
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt=""
                className="aspect-[4/3] w-full rounded-xl object-cover border border-ink-800"
              />
            ))}
          </div>
        ) : null}
        <button
          type="button"
          disabled
          className="mt-2 rounded-lg border border-ink-700 px-4 py-2 text-sm text-ink-500 cursor-not-allowed"
        >
          {t("cafe.bookSoon")}
        </button>
      </div>

      {cafe.openingHours?.length ? (
        <section className="space-y-2">
          <h2 className="font-display text-xl">{t("cafe.hours")}</h2>
          <ul className="text-sm text-ink-400 grid sm:grid-cols-2 gap-1">
            {cafe.openingHours.map((h) => (
              <li key={h.day}>
                {days[h.day] ?? h.day}:{" "}
                {h.closed ? t("cafe.closed") : `${h.open} – ${h.close}`}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
