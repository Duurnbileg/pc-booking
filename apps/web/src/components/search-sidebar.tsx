"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { API_PATHS, DISTRICTS, PRICE_RANGES } from "@pc-booking/shared";
import { api } from "@/lib/api";
import type { Cafe } from "@/lib/types";
import { cn, formatMnt } from "@/lib/utils";
import { useLocale } from "@/components/locale-provider";
import {
  clearFilters,
  hasFilters,
  priceRangeOf,
  specMatches,
  specTagsFrom,
  toggle,
  withPriceRange,
  type CafeSearch,
} from "@/lib/search";

type SearchSidebarProps = {
  value: CafeSearch;
  onChange: (next: CafeSearch) => void;
  /** Number of results for the current filters, shown on the mobile "show results" button. */
  resultCount?: number;
};

type Facet = "district" | "price" | "gpu" | "hz";

function toInput(n: number | undefined): string {
  return n === undefined ? "" : String(n);
}

function fromInput(raw: string): number | undefined {
  if (!raw.trim()) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function inPriceRange(price: number, range: { min?: number; max?: number }): boolean {
  return (range.min === undefined || price >= range.min) && (range.max === undefined || price <= range.max);
}

/** Whether a cafe passes every active filter except `skip`, so each facet counts what selecting it would add. */
function matchesExcept(cafe: Cafe, s: CafeSearch, skip: Facet): boolean {
  if (skip !== "district" && s.districts.length && !(cafe.district && s.districts.includes(cafe.district)))
    return false;
  if (skip !== "price" && !inPriceRange(cafe.pricePerHour, { min: s.minPrice, max: s.maxPrice }))
    return false;
  if (skip !== "gpu" && s.gpus.length && !s.gpus.some((g) => specMatches(cafe.displaySpecs, g)))
    return false;
  if (skip !== "hz" && s.hz.length && !s.hz.some((h) => specMatches(cafe.displaySpecs, h)))
    return false;
  return true;
}

export function SearchSidebar({ value, onChange, resultCount }: SearchSidebarProps) {
  const { t, locale } = useLocale();
  const [mobileOpen, setMobileOpen] = useState(false);
  const priceRange = priceRangeOf(value);

  const allCafes = useQuery({
    queryKey: ["cafes"],
    queryFn: () => api<{ cafes: Cafe[] }>(API_PATHS.cafes.list),
  });
  const cafes = useMemo(() => allCafes.data?.cafes ?? [], [allCafes.data]);

  const facets = useMemo(() => {
    const pool = (skip: Facet) => cafes.filter((c) => matchesExcept(c, value, skip));
    const byDistrict = pool("district");
    const byPrice = pool("price");
    const byGpu = pool("gpu");
    const byHz = pool("hz");
    const prices = cafes.map((c) => c.pricePerHour).filter((p) => p > 0);
    const tags = specTagsFrom(cafes);
    const withSelected = (options: string[], selected: string[]) => [
      ...options,
      ...selected.filter((s) => !options.includes(s)),
    ];
    return {
      districts: DISTRICTS.map((d) => ({
        ...d,
        count: byDistrict.filter((c) => c.district === d.id).length,
      })).sort((a, b) => b.count - a.count),
      prices: PRICE_RANGES.map((r) => ({
        ...r,
        count: byPrice.filter((c) => inPriceRange(c.pricePerHour, r)).length,
      })),
      gpus: withSelected(tags.gpus, value.gpus).map((gpu) => ({
        gpu,
        count: byGpu.filter((c) => specMatches(c.displaySpecs, gpu)).length,
      })),
      hz: withSelected(tags.hz, value.hz).map((hz) => ({
        hz,
        count: byHz.filter((c) => specMatches(c.displaySpecs, hz)).length,
      })),
      minPrice: prices.length ? Math.min(...prices) : undefined,
      maxPrice: prices.length ? Math.max(...prices) : undefined,
    };
  }, [cafes, value]);

  const priceKey = `${value.minPrice ?? ""}-${value.maxPrice ?? ""}`;
  const [syncedPriceKey, setSyncedPriceKey] = useState(priceKey);
  const [minInput, setMinInput] = useState(toInput(value.minPrice));
  const [maxInput, setMaxInput] = useState(toInput(value.maxPrice));
  if (priceKey !== syncedPriceKey) {
    setSyncedPriceKey(priceKey);
    setMinInput(toInput(value.minPrice));
    setMaxInput(toInput(value.maxPrice));
  }

  function commitPrice() {
    const minPrice = fromInput(minInput);
    const maxPrice = fromInput(maxInput);
    if (minPrice === value.minPrice && maxPrice === value.maxPrice) return;
    onChange({ ...value, minPrice, maxPrice });
  }

  const activeCount =
    value.districts.length +
    value.gpus.length +
    value.hz.length +
    (value.minPrice !== undefined || value.maxPrice !== undefined ? 1 : 0);
  /** Hide options no cafe has, but never hide one the user already picked. */
  const visible = (count: number, selected: boolean) => count > 0 || selected;

  return (
    <aside className="rounded-2xl border border-ink-800 bg-ink-900/60 lg:sticky lg:top-24">
      <div className="flex items-center justify-between gap-2 p-4 lg:pb-2">
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          className="flex min-w-0 flex-1 items-center gap-2 text-left lg:pointer-events-none"
        >
          <SlidersHorizontal className="h-4 w-4 text-accent" />
          <span className="font-display text-lg text-ink-100">{t("search.filters")}</span>
          {activeCount > 0 ? (
            <span className="rounded-full bg-accent px-2 text-xs font-semibold text-ink-950">
              {activeCount}
            </span>
          ) : null}
          <ChevronDown
            className={cn(
              "ml-auto h-4 w-4 text-ink-500 transition-transform lg:hidden",
              mobileOpen && "rotate-180",
            )}
          />
        </button>
        {hasFilters(value) ? (
          <button
            type="button"
            onClick={() => onChange(clearFilters(value))}
            className="shrink-0 text-sm text-accent hover:underline"
          >
            {t("search.clear")}
          </button>
        ) : null}
      </div>

      <div className={cn("px-4 pb-4 lg:block", mobileOpen ? "block" : "hidden")}>
        <Section title={t("search.price")}>
          <div className="flex flex-wrap gap-2">
            {facets.prices
              .filter((r) => visible(r.count, priceRange === r.id))
              .map((r) => (
                <Chip
                  key={r.id}
                  active={priceRange === r.id}
                  count={r.count}
                  onClick={() =>
                    onChange(withPriceRange(value, priceRange === r.id ? undefined : r.id))
                  }
                >
                  {t(`search.price${r.id}`)}
                </Chip>
              ))}
          </div>
          <form
            className="flex items-center gap-2 pt-3"
            onSubmit={(e) => {
              e.preventDefault();
              commitPrice();
            }}
          >
            <PriceInput
              label={t("search.minPrice")}
              value={minInput}
              placeholder={facets.minPrice !== undefined ? formatMnt(facets.minPrice) : ""}
              onChange={setMinInput}
              onBlur={commitPrice}
            />
            <span className="text-ink-500">–</span>
            <PriceInput
              label={t("search.maxPrice")}
              value={maxInput}
              placeholder={facets.maxPrice !== undefined ? formatMnt(facets.maxPrice) : ""}
              onChange={setMaxInput}
              onBlur={commitPrice}
            />
          </form>
        </Section>

        <Section title={t("search.district")}>
          <div className="flex flex-wrap gap-2">
            {facets.districts
              .filter((d) => visible(d.count, value.districts.includes(d.id)))
              .map((d) => (
                <Chip
                  key={d.id}
                  active={value.districts.includes(d.id)}
                  count={d.count}
                  onClick={() => onChange({ ...value, districts: toggle(value.districts, d.id) })}
                >
                  {d[locale]}
                </Chip>
              ))}
          </div>
        </Section>

        <Section title={t("search.gpu")}>
          <div className="flex flex-wrap gap-2">
            {facets.gpus
              .filter((g) => visible(g.count, value.gpus.includes(g.gpu)))
              .map(({ gpu, count }) => (
                <Chip
                  key={gpu}
                  active={value.gpus.includes(gpu)}
                  count={count}
                  onClick={() => onChange({ ...value, gpus: toggle(value.gpus, gpu) })}
                >
                  {gpu}
                </Chip>
              ))}
          </div>
        </Section>

        <Section title={t("search.hz")} last>
          <div className="flex flex-wrap gap-2">
            {facets.hz
              .filter((h) => visible(h.count, value.hz.includes(h.hz)))
              .map(({ hz, count }) => (
                <Chip
                  key={hz}
                  active={value.hz.includes(hz)}
                  count={count}
                  onClick={() => onChange({ ...value, hz: toggle(value.hz, hz) })}
                >
                  {hz}
                </Chip>
              ))}
          </div>
        </Section>

        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="mt-4 w-full rounded-xl bg-accent py-2.5 text-sm font-medium text-ink-950 transition hover:bg-accent-dim lg:hidden"
        >
          {resultCount !== undefined
            ? t("search.showResults", { n: resultCount })
            : t("search.collapse")}
        </button>
      </div>
    </aside>
  );
}

function Section({
  title,
  last,
  children,
}: {
  title: string;
  last?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={last ? "pt-4" : "border-b border-ink-800 py-4 first:pt-2"}>
      <p className="pb-3 text-sm font-semibold text-ink-100">{title}</p>
      {children}
    </div>
  );
}

function Chip({
  active,
  count,
  onClick,
  children,
}: {
  active: boolean;
  count: number;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition",
        active
          ? "border-accent bg-accent/15 text-accent"
          : "border-ink-700 text-ink-300 hover:border-ink-500 hover:text-ink-100",
      )}
    >
      {children}
      <span className={cn("text-xs tabular-nums", active ? "text-accent/80" : "text-ink-500")}>
        {count}
      </span>
    </button>
  );
}

function PriceInput({
  label,
  value,
  placeholder,
  onChange,
  onBlur,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  onBlur: () => void;
}) {
  return (
    <label className="block flex-1 rounded-lg border border-ink-700 bg-ink-950/60 px-2.5 py-1.5 focus-within:border-accent">
      <span className="block text-[10px] uppercase tracking-wide text-ink-500">{label}</span>
      <input
        inputMode="numeric"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
        onBlur={onBlur}
        className="w-full bg-transparent text-sm text-ink-100 placeholder:text-ink-500/60 focus:outline-none"
      />
    </label>
  );
}
