"use client";

import { useState, type ReactNode } from "react";
import {
  DISTRICTS,
  GPU_OPTIONS,
  MONITOR_HZ_OPTIONS,
  PRICE_RANGES,
} from "@pc-booking/shared";
import { useLocale } from "@/components/locale-provider";
import {
  clearFilters,
  hasFilters,
  priceRangeOf,
  toggle,
  withPriceRange,
  type CafeSearch,
} from "@/lib/search";

type SearchSidebarProps = {
  value: CafeSearch;
  onChange: (next: CafeSearch) => void;
};

function toInput(n: number | undefined): string {
  return n === undefined ? "" : String(n);
}

function fromInput(raw: string): number | undefined {
  if (!raw.trim()) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export function SearchSidebar({ value, onChange }: SearchSidebarProps) {
  const { t, locale } = useLocale();
  const priceRange = priceRangeOf(value);

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

  return (
    <aside className="space-y-1 rounded-2xl border border-ink-800 bg-ink-900/60 p-4 lg:sticky lg:top-6">
      <div className="flex items-center justify-between pb-2">
        <p className="font-display text-lg text-ink-100">{t("search.filters")}</p>
        {hasFilters(value) ? (
          <button
            type="button"
            onClick={() => onChange(clearFilters(value))}
            className="text-sm text-accent hover:underline"
          >
            {t("search.clear")}
          </button>
        ) : null}
      </div>

      <Section title={t("search.price")}>
        <div className="space-y-2">
          {PRICE_RANGES.map((r) => (
            <CheckRow
              key={r.id}
              round
              checked={priceRange === r.id}
              onChange={() =>
                onChange(withPriceRange(value, priceRange === r.id ? undefined : r.id))
              }
            >
              {t(`search.price${r.id}`)}
            </CheckRow>
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
            onChange={setMinInput}
            onBlur={commitPrice}
          />
          <span className="text-ink-500">–</span>
          <PriceInput
            label={t("search.maxPrice")}
            value={maxInput}
            onChange={setMaxInput}
            onBlur={commitPrice}
          />
        </form>
      </Section>

      <Section title={t("search.district")}>
        <div className="space-y-2">
          {DISTRICTS.map((d) => (
            <CheckRow
              key={d.id}
              checked={value.districts.includes(d.id)}
              onChange={() => onChange({ ...value, districts: toggle(value.districts, d.id) })}
            >
              {d[locale]}
            </CheckRow>
          ))}
        </div>
      </Section>

      <Section title={t("search.gpu")}>
        <div className="space-y-2">
          {GPU_OPTIONS.map((gpu) => (
            <CheckRow
              key={gpu}
              checked={value.gpus.includes(gpu)}
              onChange={() => onChange({ ...value, gpus: toggle(value.gpus, gpu) })}
            >
              {gpu}
            </CheckRow>
          ))}
        </div>
      </Section>

      <Section title={t("search.hz")} last>
        <div className="space-y-2">
          {MONITOR_HZ_OPTIONS.map((hz) => (
            <CheckRow
              key={hz}
              checked={value.hz.includes(hz)}
              onChange={() => onChange({ ...value, hz: toggle(value.hz, hz) })}
            >
              {hz}
            </CheckRow>
          ))}
        </div>
      </Section>
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
    <div className={last ? "pt-4" : "border-b border-ink-800 py-4"}>
      <p className="pb-3 text-sm font-semibold text-ink-100">{title}</p>
      {children}
    </div>
  );
}

/** `round` renders a radio-looking checkbox so a selected price range can be unselected. */
function CheckRow({
  round,
  checked,
  onChange,
  children,
}: {
  round?: boolean;
  checked: boolean;
  onChange: () => void;
  children: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-300 hover:text-ink-100">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className={
          round
            ? "h-4 w-4 appearance-none rounded-full border border-ink-500 checked:border-[5px] checked:border-accent"
            : "h-4 w-4 accent-[#3ddc97]"
        }
      />
      {children}
    </label>
  );
}

function PriceInput({
  label,
  value,
  onChange,
  onBlur,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
}) {
  return (
    <label className="block flex-1 rounded-lg border border-ink-700 bg-ink-950/60 px-2.5 py-1.5 focus-within:border-accent">
      <span className="block text-[10px] uppercase tracking-wide text-ink-500">{label}</span>
      <input
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
        onBlur={onBlur}
        className="w-full bg-transparent text-sm text-ink-100 focus:outline-none"
      />
    </label>
  );
}
