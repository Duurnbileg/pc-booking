"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  dictionaries,
  interpolate,
  LOCALE_STORAGE_KEY,
  type Locale,
  type TranslationKey,
} from "@/lib/i18n/dictionaries";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  days: string[];
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function lookup(locale: Locale, key: TranslationKey): string {
  const [group, field] = key.split(".") as [keyof typeof dictionaries.mn, string];
  const section = dictionaries[locale][group] as Record<string, string | string[]>;
  const value = section[field];
  if (typeof value === "string") return value;
  return key;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("mn");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (stored === "mn" || stored === "en") {
        setLocaleState(stored);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) =>
      interpolate(lookup(locale, key), vars),
    [locale],
  );

  const days = dictionaries[locale].form.days;

  const value = useMemo(
    () => ({ locale, setLocale, t, days }),
    [locale, setLocale, t, days],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}

export function useT() {
  return useLocale().t;
}
