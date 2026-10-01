"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/locale-provider";
import { SearchFilterPanel } from "@/components/search-filter-panel";
import { DatePicker } from "@/components/date-picker";
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
  /** Mobile only: the bar starts as a compact pill. */
  const [expanded, setExpanded] = useState(false);
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
    setExpanded(false);
    router.push(`/search?${searchToParams(draft).toString()}`);
  }

  const count = filterCount(draft);

  return (
    <div ref={containerRef} className="relative">
      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex w-full items-center gap-3 rounded-full border border-ink-700 bg-ink-900/90 px-4 py-2.5 text-left shadow-lg shadow-black/20 sm:hidden"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-ink-950">
            <SearchIcon />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-ink-100">
              {draft.q || t("home.searchPlaceholder")}
            </span>
            <span className="block truncate text-xs text-ink-500">
              {draft.date.replaceAll("-", ".")} · {t("search.peopleCount", { n: draft.people })}
              {count > 0 ? ` · ${t("search.selectedCount", { n: count })}` : ""}
            </span>
          </span>
        </button>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className={cn(
          "flex-col rounded-3xl border border-ink-700 bg-ink-900/90 p-1.5 shadow-lg shadow-black/20 sm:flex sm:flex-row sm:items-center sm:rounded-full",
          expanded ? "flex" : "hidden",
        )}
      >
        <div className="flex items-center justify-between px-4 pb-1 pt-2 sm:hidden">
          <span className="text-sm font-semibold text-ink-100">{t("home.search")}</span>
          <button
            type="button"
            onClick={() => {
              setExpanded(false);
              setPanelOpen(false);
            }}
            aria-label={t("search.collapse")}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-ink-700 text-ink-300 transition hover:text-ink-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <label className="flex min-w-0 flex-[1.4] cursor-text flex-col rounded-2xl px-4 py-2 sm:rounded-full sm:px-5 transition hover:bg-ink-800/70 focus-within:bg-ink-800/70">
          <span className="text-xs font-semibold text-ink-100">{t("search.where")}</span>
          <span className="flex items-center gap-2">
            <input
              value={draft.q}
              onChange={(e) => setDraft({ ...draft, q: e.target.value })}
              onFocus={() => setPanelOpen(true)}
              onClick={() => setPanelOpen(true)}
              placeholder={t("home.searchPlaceholder")}
              className="min-w-0 flex-1 bg-transparent py-0.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
            />
            {hasFilters(draft) ? (
              <button
                type="button"
                onClick={() => setPanelOpen(true)}
                className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-medium text-accent"
              >
                {t("search.selectedCount", { n: count })}
              </button>
            ) : null}
          </span>
        </label>

        <Divider />

        <div className="flex flex-col rounded-2xl px-4 py-2 sm:rounded-full sm:px-5 transition hover:bg-ink-800/70 [&_button]:py-0">
          <span className="text-xs font-semibold text-ink-100">{t("search.date")}</span>
          <DatePicker
            value={draft.date}
            min={todayIso()}
            onChange={(date) => setDraft({ ...draft, date })}
            onOpen={closePanel}
          />
        </div>

        <Divider />

        <div className="flex flex-col rounded-2xl px-4 py-2 sm:rounded-full sm:px-5 transition hover:bg-ink-800/70">
          <span className="text-xs font-semibold text-ink-100">{t("search.people")}</span>
          <div className="flex items-center gap-2">
            <StepperButton
              label={t("search.decrease")}
              disabled={draft.people <= 1}
              onClick={() => setDraft({ ...draft, people: draft.people - 1 })}
            >
              −
            </StepperButton>
            <span className="min-w-[3rem] text-center text-sm font-medium text-ink-100">
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
          aria-label={t("home.search")}
          className="mt-1.5 flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-accent px-5 font-medium text-ink-950 transition hover:bg-accent-dim sm:ml-1 sm:mt-0 sm:w-12 sm:px-0"
        >
          <SearchIcon />
          <span className="sm:hidden">{t("home.search")}</span>
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
  return <span className="hidden h-8 w-px shrink-0 bg-ink-700 sm:block" />;
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
      className="flex h-6 w-6 items-center justify-center rounded-full border border-ink-700 text-ink-100 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-ink-700 disabled:hover:text-ink-100"
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
      className="h-5 w-5 shrink-0"
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
