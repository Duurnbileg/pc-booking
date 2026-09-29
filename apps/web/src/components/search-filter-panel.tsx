"use client";

import { useEffect, type ReactNode, type RefObject } from "react";
import {
  DISTRICTS,
  GPU_OPTIONS,
  MONITOR_HZ_OPTIONS,
  PRICE_RANGES,
} from "@pc-booking/shared";
import { useLocale } from "@/components/locale-provider";
import { priceRangeOf, toggle, withPriceRange, type CafeSearch } from "@/lib/search";
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
    <div className="absolute left-0 right-0 top-full z-30 mt-2 space-y-6 rounded-2xl border border-ink-700 bg-ink-900 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
      <FilterSection title={t("search.district")}>
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

      <FilterSection title={t("search.price")}>
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

      <div className="grid gap-6 sm:grid-cols-2">
        <FilterSection title={t("search.gpu")}>
          <div className="flex flex-wrap gap-2">
            {GPU_OPTIONS.map((gpu) => (
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

        <FilterSection title={t("search.hz")}>
          <div className="flex flex-wrap gap-2">
            {MONITOR_HZ_OPTIONS.map((hz) => (
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

function FilterSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-ink-100">{title}</p>
      {children}
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
