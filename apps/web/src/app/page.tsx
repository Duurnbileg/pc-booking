"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { API_PATHS } from "@pc-booking/shared";
import { api } from "@/lib/api";
import type { Cafe } from "@/lib/types";
import { formatMnt } from "@/lib/utils";
import { useT } from "@/components/locale-provider";

function cafeBlurb(cafe: Cafe): string {
  const parts: string[] = [];
  if (cafe.address) parts.push(cafe.address);
  if (cafe.gear) parts.push(cafe.gear);
  if (cafe.displaySpecs) parts.push(cafe.displaySpecs);
  if (!parts.length && cafe.description) return cafe.description;
  return parts.join(" · ");
}

export default function HomePage() {
  const t = useT();
  const [q, setQ] = useState("");
  const [submitted, setSubmitted] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["cafes", submitted],
    queryFn: () =>
      api<{ cafes: Cafe[] }>(
        `${API_PATHS.cafes.list}${submitted ? `?q=${encodeURIComponent(submitted)}` : ""}`,
      ),
  });

  const cafes = data?.cafes ?? [];
  const subtitle = useMemo(() => {
    if (submitted) return t("home.subtitleResults", { q: submitted });
    return t("home.subtitleDefault");
  }, [submitted, t]);

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <p className="font-display text-4xl sm:text-5xl tracking-tight text-ink-100">
          PC<span className="text-accent">Book</span>
        </p>
        <h1 className="text-xl text-ink-300 max-w-xl">{t("home.tagline")}</h1>
        <form
          className="flex flex-col sm:flex-row gap-2 max-w-xl"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(q.trim());
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("home.searchPlaceholder")}
            className="flex-1 rounded-lg border border-ink-700 bg-ink-900/80 px-4 py-3 text-ink-100 placeholder:text-ink-500 focus:border-accent"
          />
          <button
            type="submit"
            className="rounded-lg bg-accent px-5 py-3 font-medium text-ink-950 hover:bg-accent-dim transition"
          >
            {t("home.search")}
          </button>
        </form>
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl text-ink-100">{subtitle}</h2>
          <span className="text-sm text-ink-500">
            {t("home.centersCount", { n: cafes.length })}
          </span>
        </div>

        {isLoading ? (
          <p className="text-ink-500">{t("home.loading")}</p>
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
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cover}
                        alt={cafe.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-ink-800 to-ink-950">
                        <span className="font-display text-2xl text-ink-500">
                          PC<span className="text-accent/50">Book</span>
                        </span>
                      </div>
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
