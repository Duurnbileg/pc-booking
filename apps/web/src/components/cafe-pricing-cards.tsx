"use client";

import { Crown, Gamepad2, MemoryStick, Monitor, Zap, type LucideIcon } from "lucide-react";
import type { PricingTier } from "@pc-booking/shared";
import type { Cafe } from "@/lib/types";
import { cn, formatMnt } from "@/lib/utils";
import { useLocale } from "@/components/locale-provider";

export type TierVariant = "hall" | "vip";

export const TIER_SPECS: {
  key: "gpu" | "cpu" | "ram" | "monitor";
  icon: LucideIcon;
  iconClass: string;
}[] = [
  { key: "gpu", icon: Gamepad2, iconClass: "text-violet-400" },
  { key: "cpu", icon: Zap, iconClass: "text-orange-400" },
  { key: "ram", icon: MemoryStick, iconClass: "text-sky-400" },
  { key: "monitor", icon: Monitor, iconClass: "text-accent" },
];

export const TIER_STYLES: Record<
  TierVariant,
  { title: string; card: string; glow: string }
> = {
  hall: {
    title: "text-accent",
    card: "border-ink-800 bg-ink-900/60 hover:border-accent/50 hover:shadow-[0_20px_50px_rgba(61,220,151,0.12)]",
    glow: "bg-accent/10",
  },
  vip: {
    title: "text-status-inuse",
    card: "border-status-inuse/30 bg-gradient-to-br from-status-inuse/[0.06] via-ink-900/60 to-ink-900/60 hover:border-status-inuse/60 hover:shadow-[0_20px_50px_rgba(245,197,66,0.12)]",
    glow: "bg-status-inuse/10",
  },
};

export function CafePricingCards({ cafe }: { cafe: Cafe }) {
  const { t } = useLocale();
  const { hall, vip } = cafe.pricing;
  const hasTierSpecs = [hall, vip].some(
    (tier) => tier && TIER_SPECS.some((spec) => tier[spec.key]?.trim()),
  );

  return (
    <section aria-label={t("cafe.pricing")}>
      <div className="grid gap-4 sm:grid-cols-2">
        <TierCard
          variant="hall"
          tier={hall}
          legacySpecs={hasTierSpecs ? undefined : cafe.displaySpecs}
        />
        {vip ? <TierCard variant="vip" tier={vip} /> : null}
      </div>
    </section>
  );
}

function TierCard({
  variant,
  tier,
  legacySpecs,
}: {
  variant: TierVariant;
  tier: PricingTier;
  legacySpecs?: string;
}) {
  const { t } = useLocale();
  const styles = TIER_STYLES[variant];
  const rows = TIER_SPECS.filter((spec) => tier[spec.key]?.trim());

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-5 shadow-[0_12px_40px_rgba(0,0,0,0.25)] transition duration-300 hover:-translate-y-0.5",
        styles.card,
      )}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl",
          styles.glow,
        )}
      />
      <div className="relative flex items-baseline justify-between gap-3">
        <h3
          className={cn(
            "inline-flex items-center gap-2 font-display text-xl font-semibold",
            styles.title,
          )}
        >
          {variant === "vip" ? <Crown className="h-5 w-5" /> : null}
          {t(variant === "vip" ? "cafe.vip" : "cafe.hall")}
        </h3>
        <p className="font-display text-2xl font-bold text-ink-100">
          {formatMnt(tier.price)}
          <span className="ml-0.5 text-sm font-normal text-ink-500">
            {t("home.perHour")}
          </span>
        </p>
      </div>

      {rows.length ? (
        <ul className="relative mt-4 space-y-2">
          {rows.map(({ key, icon: Icon, iconClass }) => (
            <li
              key={key}
              className="flex items-center justify-between gap-3 rounded-xl bg-ink-950/60 px-4 py-3 text-sm"
            >
              <span className="inline-flex items-center gap-2.5 text-ink-500">
                <Icon className={cn("h-4 w-4", iconClass)} />
                {t(`cafe.${key}`)}
              </span>
              <span className="text-right font-medium text-ink-100">{tier[key]}</span>
            </li>
          ))}
        </ul>
      ) : legacySpecs ? (
        <p className="relative mt-4 rounded-xl bg-ink-950/60 px-4 py-3 text-sm text-ink-300">
          {legacySpecs}
        </p>
      ) : null}
    </div>
  );
}
