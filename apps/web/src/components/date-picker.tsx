"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/locale-provider";
import { todayIso } from "@/lib/search";
import { cn } from "@/lib/utils";

type DatePickerProps = {
  /** ISO `YYYY-MM-DD`. */
  value: string;
  min: string;
  onChange: (date: string) => void;
  onOpen?: () => void;
};

type YearMonth = { y: number; m: number };

function parseIso(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m: m - 1, d };
}

function toIso(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function shiftMonth({ y, m }: YearMonth, delta: number): YearMonth {
  const date = new Date(y, m + delta, 1);
  return { y: date.getFullYear(), m: date.getMonth() };
}

export function DatePicker({ value, min, onChange, onOpen }: DatePickerProps) {
  const { t, locale, days } = useLocale();
  const [open, setOpen] = useState(false);
  // Popover content renders only after the first open, so Intl output can't cause a hydration mismatch.
  const [everOpened, setEverOpened] = useState(false);
  const [view, setView] = useState<YearMonth>(() => parseIso(value));
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function toggle() {
    if (!open) {
      setView(parseIso(value));
      setEverOpened(true);
      onOpen?.();
    }
    setOpen(!open);
  }

  function pick(iso: string) {
    onChange(iso);
    setOpen(false);
    triggerRef.current?.focus();
  }

  const minParts = parseIso(min);
  const canGoPrev = view.y > minParts.y || (view.y === minParts.y && view.m > minParts.m);
  const today = todayIso();
  const weekdays = [...days.slice(1), days[0]];
  const leadingBlanks = (new Date(view.y, view.m, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const intlLocale = locale === "mn" ? "mn-MN" : "en-US";

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg py-1.5 text-sm font-medium text-ink-100 transition hover:text-accent focus:outline-none"
      >
        <span className="tabular-nums">{value.replaceAll("-", ".")}</span>
        <CalendarIcon className="h-4 w-4 text-accent" />
      </button>

      <div
        role="dialog"
        aria-label={t("search.date")}
        className={cn(
          "absolute left-0 top-full z-40 mt-3 w-[320px] rounded-2xl border border-ink-700 bg-ink-900 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.5)] transition duration-200",
          open ? "visible translate-y-0 opacity-100" : "invisible pointer-events-none -translate-y-1 opacity-0",
        )}
      >
        {everOpened ? (
          <>
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display text-base capitalize text-accent">
                {new Intl.DateTimeFormat(intlLocale, { month: "long", year: "numeric" }).format(
                  new Date(view.y, view.m, 1),
                )}
              </span>
              <div className="flex items-center gap-1">
                <NavButton
                  label={t("search.prevMonth")}
                  disabled={!canGoPrev}
                  onClick={() => setView(shiftMonth(view, -1))}
                >
                  <ChevronIcon className="h-4 w-4 rotate-180" />
                </NavButton>
                <NavButton label={t("search.nextMonth")} onClick={() => setView(shiftMonth(view, 1))}>
                  <ChevronIcon className="h-4 w-4" />
                </NavButton>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {weekdays.map((day) => (
                <span key={day} className="py-1 text-xs font-medium text-accent/60">
                  {day}
                </span>
              ))}
              {Array.from({ length: leadingBlanks }, (_, i) => (
                <span key={`blank-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const iso = toIso(view.y, view.m, day);
                const disabled = iso < min;
                const selected = iso === value;
                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={disabled}
                    onClick={() => pick(iso)}
                    aria-label={new Intl.DateTimeFormat(intlLocale, { dateStyle: "full" }).format(
                      new Date(view.y, view.m, day),
                    )}
                    aria-pressed={selected}
                    className={cn(
                      "mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm tabular-nums transition",
                      selected
                        ? "bg-accent font-semibold text-ink-950"
                        : disabled
                          ? "cursor-not-allowed text-ink-700"
                          : "text-accent hover:bg-accent/10",
                      !selected && !disabled && iso === today && "ring-1 ring-accent/50",
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex justify-end border-t border-ink-800 pt-3">
              <button
                type="button"
                onClick={() => pick(min)}
                className="rounded-lg px-2 py-1 text-sm font-medium text-accent transition hover:text-accent-dim"
              >
                {t("search.today")}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function NavButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-full text-accent transition hover:bg-accent/10 disabled:cursor-not-allowed disabled:text-ink-700 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
