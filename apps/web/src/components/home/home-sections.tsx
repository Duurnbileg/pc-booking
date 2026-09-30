"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Gamepad2,
  MapPinned,
  Scale,
  Search,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { Cafe } from "@/lib/types";
import { formatMnt } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";
import { useT } from "@/components/locale-provider";
import { BrandMark } from "@/components/brand-logo";
import { Skeleton } from "@/components/ui/skeleton";

export function StatsStrip({ cafes, loading }: { cafes: Cafe[]; loading: boolean }) {
  const t = useT();
  const districts = new Set(cafes.map((c) => c.district).filter(Boolean)).size;
  const prices = cafes.map((c) => c.pricePerHour).filter((p) => p > 0);
  const minPrice = prices.length ? Math.min(...prices) : null;

  const stats: { icon: LucideIcon; label: string; value: string }[] = [
    { icon: Building2, label: t("home.statCafes"), value: String(cafes.length) },
    { icon: MapPinned, label: t("home.statDistricts"), value: String(districts) },
    {
      icon: Wallet,
      label: t("home.statFrom"),
      value: minPrice === null ? "—" : formatMnt(minPrice),
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {stats.map(({ icon: Icon, label, value }) => (
        <div
          key={label}
          className="flex items-center gap-3 rounded-2xl border border-ink-800 bg-ink-900/60 p-4"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            {loading ? (
              <Skeleton className="mb-1 h-6 w-12" />
            ) : (
              <p className="font-display text-2xl font-semibold leading-tight text-ink-100 tabular-nums">
                {value}
              </p>
            )}
            <p className="truncate text-xs text-ink-500">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function HowItWorks() {
  const t = useT();
  const steps: { icon: LucideIcon; title: string; body: string }[] = [
    { icon: Search, title: t("home.step1Title"), body: t("home.step1Body") },
    { icon: Scale, title: t("home.step2Title"), body: t("home.step2Body") },
    { icon: Gamepad2, title: t("home.step3Title"), body: t("home.step3Body") },
  ];

  return (
    <section className="space-y-5">
      <h2 className="font-display text-2xl text-ink-100">{t("home.howTitle")}</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {steps.map(({ icon: Icon, title, body }, i) => (
          <div
            key={title}
            className="relative overflow-hidden rounded-2xl border border-ink-800 bg-ink-900/60 p-5"
          >
            <span className="pointer-events-none absolute -right-2 -top-4 font-display text-7xl font-bold text-ink-800/60">
              {i + 1}
            </span>
            <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-accent/20">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="relative mt-4 font-display text-lg text-ink-100">{title}</h3>
            <p className="relative mt-1.5 text-sm leading-relaxed text-ink-300">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function OwnerCta() {
  const t = useT();
  const { user } = useAuth();
  const canList = user?.role === "CAFE_OWNER" || user?.role === "ADMIN";

  return (
    <section className="relative overflow-hidden rounded-3xl border border-accent/20 bg-gradient-to-br from-accent/15 via-ink-900 to-ink-900 p-6 sm:p-10">
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
      <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="flex items-start gap-4">
          <BrandMark size={48} className="hidden sm:block" />
          <div className="space-y-1.5">
            <h2 className="font-display text-2xl text-ink-100 sm:text-3xl">{t("home.ctaTitle")}</h2>
            <p className="max-w-lg text-ink-300">{t("home.ctaBody")}</p>
          </div>
        </div>
        <Link
          href={canList ? "/owner/cafes/new" : "/register"}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-accent px-5 py-3 font-medium text-ink-950 transition hover:bg-accent-dim"
        >
          {t("home.ctaButton")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
