import type { Locale } from "@/lib/i18n/dictionaries";

export function formatDate(
  value: string | null | undefined,
  locale: Locale,
  withTime = false,
): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale === "mn" ? "mn-MN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}
