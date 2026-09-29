"use client";

import { useLocale } from "@/components/locale-provider";
import type { Locale } from "@/lib/i18n/dictionaries";

const LOCALE_CODES: Record<Locale, string> = { mn: "MN", en: "ENG" };

export function LocaleMenu() {
  const { locale, setLocale, t } = useLocale();
  const next: Locale = locale === "mn" ? "en" : "mn";

  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      aria-label={t("nav.language")}
      title={t(next === "mn" ? "nav.langMn" : "nav.langEn")}
      className="flex h-9 items-center gap-2 rounded-full border border-ink-700 bg-ink-900 px-3.5 text-sm font-semibold text-accent transition hover:border-accent/60 hover:bg-ink-800"
    >
      <GlobeIcon className="h-4 w-4 text-accent" />
      <span className="tracking-wide">{LOCALE_CODES[locale]}</span>
    </button>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.75 5.6 3.75 9S14.5 18.4 12 21c-2.5-2.6-3.75-5.6-3.75-9S9.5 5.6 12 3z" />
    </svg>
  );
}
