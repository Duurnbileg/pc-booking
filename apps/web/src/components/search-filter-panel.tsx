"use client";

import { useEffect, useMemo, useState, type ReactNode, type RefObject } from "react";
import { ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { API_PATHS, DISTRICTS, PRICE_RANGES } from "@pc-booking/shared";
import { api } from "@/lib/api";
import type { Cafe } from "@/lib/types";
import { useLocale } from "@/components/locale-provider";
import {
  priceRangeOf,
  specTagsFrom,
  toggle,
  withPriceRange,
  type CafeSearch,
} from "@/lib/search";
import { cn } from "@/lib/utils";

type SearchFilterPanelProps = {
  open: boolean;
  value: CafeSearch;
  onChange: (next: CafeSearch) => void;
  onClose: () => void;
  /** Clicks inside this element (search bar + panel) keep the panel open. */
  containerRef: RefObject<HTMLElement | null>;
};

/** Draft-only filter picker: changes stay local until the search bar is submitted. */
export function SearchFilterPanel({
  open,
  value,
  onChange,
  onClose,
  containerRef,
}: SearchFilterPanelProps) {
  const { t, locale } = useLocale();
  const allCafes = useQuery({
    queryKey: ["cafes"],
    queryFn: () => api<{ cafes: Cafe[] }>(API_PATHS.cafes.list),
    enabled: open,
  });
  const tags = useMemo(() => specTagsFrom(allCafes.data?.cafes ?? []), [allCafes.data]);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) onClose();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, containerRef]);

  if (!open) return null;

  const priceRange = priceRangeOf(value);

  return (
    <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-[65vh] space-y-4 overflow-y-auto rounded-2xl border border-ink-700 bg-ink-900 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.45)] sm:max-h-none sm:space-y-6 sm:overflow-visible sm:p-5">
      <FilterSection title={t("search.district")} count={value.districts.length}>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3 lg:grid-cols-5">
          {DISTRICTS.map((d) => (
            <OptionButton
              key={d.id}
              active={value.districts.includes(d.id)}
              onClick={() => onChange({ ...value, districts: toggle(value.districts, d.id) })}
            >
              {d[locale]}
            </OptionButton>
          ))}
        </div>
      </FilterSection>

      <FilterSection title={t("search.price")} count={priceRange ? 1 : 0}>
        <div className="flex flex-wrap gap-2">
          {PRICE_RANGES.map((r) => (
            <Chip
              key={r.id}
              active={priceRange === r.id}
              onClick={() =>
                onChange(withPriceRange(value, priceRange === r.id ? undefined : r.id))
              }
            >
              {t(`search.price${r.id}`)}
            </Chip>
          ))}
        </div>
      </FilterSection>

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
        <FilterSection title={t("search.gpu")} count={value.gpus.length}>
          <div className="flex flex-wrap gap-2">
            {tags.gpus.map((gpu) => (
              <Chip
                key={gpu}
                active={value.gpus.includes(gpu)}
                onClick={() => onChange({ ...value, gpus: toggle(value.gpus, gpu) })}
              >
                {gpu}
              </Chip>
            ))}
          </div>
        </FilterSection>

        <FilterSection title={t("search.hz")} count={value.hz.length}>
          <div className="flex flex-wrap gap-2">
            {tags.hz.map((hz) => (
              <Chip
                key={hz}
                active={value.hz.includes(hz)}
                onClick={() => onChange({ ...value, hz: toggle(value.hz, hz) })}
              >
                {hz}
              </Chip>
            ))}
          </div>
        </FilterSection>
      </div>
    </div>
  );
}

/** Collapsible on mobile; always expanded from `sm` up. */
function FilterSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-ink-800 pb-4 last:border-0 last:pb-0 sm:space-y-3 sm:border-0 sm:pb-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between text-left sm:pointer-events-none"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-ink-100">
          {title}
          {count > 0 ? (
            <span className="rounded-full bg-accent/15 px-1.5 text-xs font-medium text-accent">
              {count}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 text-ink-500 transition-transform sm:hidden", open && "rotate-180")}
        />
      </button>
      <div className={cn("mt-3 sm:mt-0 sm:block", open ? "block" : "hidden")}>{children}</div>
    </div>
  );
}

function OptionButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg px-2 py-2 text-left text-sm transition",
        active
          ? "bg-accent/15 text-accent"
          : "text-ink-300 hover:bg-ink-800 hover:text-ink-100",
      )}
    >
      {children}
    </button>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm transition",
        active
          ? "border-accent bg-accent/15 text-accent"
          : "border-ink-700 text-ink-300 hover:border-ink-500 hover:text-ink-100",
      )}
    >
      {children}
    </button>
  );
}
