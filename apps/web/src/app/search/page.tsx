"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { API_PATHS, CAFE_SORTS, type CafeSort } from "@pc-booking/shared";
import { api } from "@/lib/api";
import type { Cafe } from "@/lib/types";
import { cn, districtLabel, formatMnt } from "@/lib/utils";
import { parseSearch, searchToParams, todayIso, type CafeSearch } from "@/lib/search";
import { useLocale } from "@/components/locale-provider";
import { SearchBar } from "@/components/search-bar";
import { SearchSidebar } from "@/components/search-sidebar";
import { ResultListSkeleton } from "@/components/skeletons";
import { CafeCoverFallback, ImageWithSkeleton } from "@/components/image-with-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchResults />
    </Suspense>
  );
}

function SearchResults() {
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const paramsKey = searchParams.toString();
  const search = useMemo(() => parseSearch(new URLSearchParams(paramsKey)), [paramsKey]);
  const apiQuery = searchToParams(search).toString();

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["cafes", "search", apiQuery],
    queryFn: () =>
      api<{ cafes: Cafe[] }>(`${API_PATHS.cafes.list}${apiQuery ? `?${apiQuery}` : ""}`),
    placeholderData: keepPreviousData,
  });

  function update(next: CafeSearch) {
    router.replace(`${pathname}?${searchToParams(next).toString()}`, { scroll: false });
  }

  const cafes = data?.cafes ?? [];

  return (
    <div className="space-y-6">
      <SearchBar initial={search} />

      <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:items-start">
        <SearchSidebar value={search} onChange={update} />

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl text-ink-100">
                {search.q ? `“${search.q}”` : t("search.title")}
              </h1>
              {isLoading ? (
                <Skeleton className="mt-1.5 h-4 w-48" />
              ) : (
                <p className="text-sm text-ink-500">
                  {t("search.resultsCount", { n: cafes.length })} ·{" "}
                  {t("search.peopleCount", { n: search.people })} · {search.date}
                </p>
              )}
            </div>
            <label className="flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-900/80 px-3 py-2 text-sm">
              <span className="text-ink-500">{t("search.sortLabel")}</span>
              <select
                value={search.sort}
                onChange={(e) => update({ ...search, sort: e.target.value as CafeSort })}
                className="bg-transparent text-ink-100 focus:outline-none"
              >
                {CAFE_SORTS.map((s) => (
                  <option key={s} value={s} className="bg-ink-900">
                    {t(`search.sort${s}`)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {isLoading ? (
            <ResultListSkeleton count={3} />
          ) : error ? (
            <p className="text-status-reserved">{t("home.loadError")}</p>
          ) : cafes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink-700 px-6 py-14 text-center">
              <p className="text-ink-100">{t("search.empty")}</p>
              <p className="pt-1 text-sm text-ink-500">{t("search.emptyHint")}</p>
            </div>
          ) : (
            <div className={cn("space-y-4 transition", isFetching && "opacity-60")}>
              {cafes.map((cafe) => (
                <ResultCard key={cafe.id} cafe={cafe} live={search.date === todayIso()} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/** `live` is false for future dates, where current seat availability says nothing useful. */
function ResultCard({ cafe, live }: { cafe: Cafe; live: boolean }) {
  const { t, locale } = useLocale();
  const cover = cafe.images?.[0];
  const total = cafe.pcCount ?? 0;
  const available = cafe.availablePcs;
  const district = districtLabel(cafe.district, locale);

  return (
    <Link
      href={`/cafes/${cafe.slug}`}
      className="group grid overflow-hidden rounded-2xl border border-ink-800 bg-ink-900/50 transition hover:border-accent/40 hover:bg-ink-900/80 sm:grid-cols-[240px_1fr]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-ink-800 sm:aspect-auto sm:min-h-[200px]">
        {cover ? (
          <ImageWithSkeleton
            src={cover}
            alt={cafe.name}
            className="transition-[opacity,transform] group-hover:scale-[1.03]"
            fallback={<CafeCoverFallback />}
          />
        ) : (
          <div className="absolute inset-0">
            <CafeCoverFallback />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h2 className="font-display text-xl text-ink-100 group-hover:text-accent">
            {cafe.name}
          </h2>
          <p className="text-sm text-ink-300">
            {district ? <span className="text-accent">{district}</span> : null}
            {district ? " · " : ""}
            {cafe.address}
          </p>
          {cafe.displaySpecs ? (
            <p className="text-sm text-ink-100">{cafe.displaySpecs}</p>
          ) : null}
          {cafe.gear ? <p className="line-clamp-2 text-sm text-ink-500">{cafe.gear}</p> : null}
          {live ? (
            <AvailabilityBadge available={available} total={total} />
          ) : (
            <span className="inline-flex rounded-full border border-ink-700 px-2.5 py-1 text-xs text-ink-300">
              {t("home.pcs", { n: total })}
            </span>
          )}
        </div>

        <div className="flex shrink-0 flex-row items-end justify-between gap-3 sm:flex-col sm:items-end">
          <p className="text-right">
            <span className="block text-2xl font-semibold text-accent">
              {formatMnt(cafe.pricePerHour)}
            </span>
            <span className="text-xs text-ink-500">{t("home.perHour")}</span>
          </p>
          <span className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-ink-950 transition group-hover:bg-accent-dim">
            {t("search.details")} →
          </span>
        </div>
      </div>
    </Link>
  );
}

function AvailabilityBadge({
  available,
  total,
}: {
  available: number | null | undefined;
  total: number;
}) {
  const { t } = useLocale();
  if (available === null || available === undefined) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-700 px-2.5 py-1 text-xs text-ink-500">
        {t("search.noLive")}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        available > 0
          ? "border-status-available/40 bg-status-available/10 text-status-available"
          : "border-status-reserved/40 bg-status-reserved/10 text-status-reserved",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          available > 0 ? "bg-status-available" : "bg-status-reserved",
        )}
      />
      {t("search.available", { a: available, t: total })}
    </span>
  );
}
