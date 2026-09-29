import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { DISTRICTS } from "@pc-booking/shared";
import type { Locale } from "@/lib/i18n/dictionaries";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMnt(amount: number): string {
  return `₮${amount.toLocaleString("en-US")}`;
}

export function districtLabel(id: string | null | undefined, locale: Locale): string {
  const district = DISTRICTS.find((d) => d.id === id);
  return district ? district[locale] : "";
}
