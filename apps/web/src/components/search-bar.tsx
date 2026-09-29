"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/locale-provider";
import { SearchFilterPanel } from "@/components/search-filter-panel";
import {
  MAX_PEOPLE,
  emptySearch,
  hasFilters,
  searchToParams,
  todayIso,
  type CafeSearch,
} from "@/lib/search";

type SearchBarProps = {
  initial?: CafeSearch;
};

function filterCount(search: CafeSearch): number {
  return (
    search.districts.length +
    search.gpus.length +
    search.hz.length +
    (search.minPrice !== undefined || search.maxPrice !== undefined ? 1 : 0)
  );
}

export function SearchBar({ initial }: SearchBarProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [draft, setDraft] = useState<CafeSearch>(() => initial ?? emptySearch());
  const [panelOpen, setPanelOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closePanel = useCallback(() => setPanelOpen(false), []);

  const initialKey = initial ? searchToParams(initial).toString() : "";
  const [syncedKey, setSyncedKey] = useState(initialKey);
  if (initial && initialKey !== syncedKey) {
    setSyncedKey(initialKey);
    setDraft(initial);
  }

  function submit() {
    setPanelOpen(false);
    router.push(`/search?${searchToParams(draft).toString()}`);
  }

  const count = filterCount(draft);

  return (
    <div ref={containerRef} className="relative">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex flex-col gap-2 rounded-2xl border border-ink-700 bg-ink-900/80 p-2 lg:flex-row lg:items-stretch lg:gap-0"
      >
        <label className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2 focus-within:bg-ink-800/70">
          <SearchIcon />
          <input
            value={draft.q}
            onChange={(e) => setDraft({ ...draft, q: e.target.value })}
            onFocus={() => setPanelOpen(true)}
            onClick={() => setPanelOpen(true)}
            placeholder={t("home.searchPlaceholder")}
            className="min-w-0 flex-1 bg-transparent py-1.5 text-ink-100 placeholder:text-ink-500 focus:outline-none"
          />
          {hasFilters(draft) ? (
            <button
              type="button"
              onClick={() => setPanelOpen(true)}
              className="shrink-0 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent"
            >
              {t("search.selectedCount", { n: count })}
            </button>
          ) : null}
        </label>

        <Divider />

        <label className="flex items-center gap-2 rounded-xl px-3 py-2 focus-within:bg-ink-800/70">
          <span className="text-xs text-ink-500">{t("search.date")}</span>
          <input
            type="date"
            value={draft.date}
            min={todayIso()}
            onChange={(e) => setDraft({ ...draft, date: e.target.value || todayIso() })}
            className="bg-transparent py-1.5 text-sm font-medium text-ink-100 [color-scheme:dark] focus:outline-none"
          />
        </label>

        <Divider />

        <div className="flex items-center gap-3 rounded-xl px-3 py-2">
          <span className="text-xs text-ink-500">{t("search.people")}</span>
          <div className="flex items-center gap-2">
            <StepperButton
              label={t("search.decrease")}
              disabled={draft.people <= 1}
              onClick={() => setDraft({ ...draft, people: draft.people - 1 })}
            >
              −
            </StepperButton>
            <span className="min-w-[3.5rem] text-center text-sm font-medium text-ink-100">
              {t("search.peopleCount", { n: draft.people })}
            </span>
            <StepperButton
              label={t("search.increase")}
              disabled={draft.people >= MAX_PEOPLE}
              onClick={() => setDraft({ ...draft, people: draft.people + 1 })}
            >
              +
            </StepperButton>
          </div>
        </div>

        <button
          type="submit"
          className="rounded-xl bg-accent px-6 py-3 font-medium text-ink-950 transition hover:bg-accent-dim lg:ml-2"
        >
          {t("home.search")}
        </button>
      </form>

      <SearchFilterPanel
        open={panelOpen}
        value={draft}
        onChange={setDraft}
        onClose={closePanel}
        containerRef={containerRef}
      />
    </div>
  );
}

function Divider() {
  return <span className="hidden w-px self-stretch bg-ink-700 lg:my-2 lg:block" />;
}

function StepperButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-full border border-ink-700 text-ink-100 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-ink-700 disabled:hover:text-ink-100"
    >
      {children}
    </button>
  );
}

function SearchIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0 text-ink-500"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
