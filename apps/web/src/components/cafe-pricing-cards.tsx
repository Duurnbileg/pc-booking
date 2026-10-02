"use client";

import { Crown, Gamepad2, MemoryStick, Monitor, Zap, type LucideIcon } from "lucide-react";
import type { PricingTier } from "@pc-booking/shared";
import { cafeSeatStats } from "@/lib/mock-seats";
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
    card: "border-ink-800 bg-ink-900/60 hover:border-accent/50 hover:shadow-[0_20px_50px_rgba(79,157,255,0.12)]",
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
  const { byZone } = cafeSeatStats(cafe);
  const hasTierSpecs = [hall, vip].some(
    (tier) => tier && TIER_SPECS.some((spec) => tier[spec.key]?.trim()),
  );

  return (
    <section aria-label={t("cafe.pricing")}>
      <div className="grid gap-4">
        <TierCard
          variant="hall"
          tier={hall}
          pcs={byZone.hall}
          legacySpecs={hasTierSpecs ? undefined : cafe.displaySpecs}
        />
        {vip ? <TierCard variant="vip" tier={vip} pcs={byZone.vip} /> : null}
      </div>
    </section>
  );
}

function TierCard({
  variant,
  tier,
  pcs,
  legacySpecs,
}: {
  variant: TierVariant;
  tier: PricingTier;
  pcs: number;
  legacySpecs?: string;
}) {
  const { t } = useLocale();
  const styles = TIER_STYLES[variant];
  const rows = TIER_SPECS.filter((spec) => tier[spec.key]?.trim());

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-4 transition duration-300",
        styles.card,
      )}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-3xl",
          styles.glow,
        )}
      />
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <h3
            className={cn(
              "inline-flex items-center gap-1.5 font-display text-lg font-semibold",
              styles.title,
            )}
          >
            {variant === "vip" ? <Crown className="h-4 w-4" /> : null}
            {t(variant === "vip" ? "cafe.vip" : "cafe.hall")}
          </h3>
          {pcs > 0 ? (
            <span className="rounded-full bg-ink-950/60 px-2 py-0.5 text-xs text-ink-300">
              {t("home.pcs", { n: pcs })}
            </span>
          ) : null}
        </div>
        <p className="shrink-0 font-display text-xl font-bold text-ink-100">
          {formatMnt(tier.price)}
          <span className="ml-0.5 text-xs font-normal text-ink-500">{t("home.perHour")}</span>
        </p>
      </div>

      {rows.length ? (
        <dl className="relative mt-3 grid grid-cols-2 gap-2">
          {rows.map(({ key, icon: Icon, iconClass }) => (
            <div key={key} className="min-w-0 rounded-lg bg-ink-950/60 px-3 py-2">
              <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-ink-500">
                <Icon className={cn("h-3.5 w-3.5", iconClass)} />
                {t(`cafe.${key}`)}
              </dt>
              <dd title={tier[key]} className="mt-0.5 truncate text-sm font-medium text-ink-100">
                {tier[key]}
              </dd>
            </div>
          ))}
        </dl>
      ) : legacySpecs ? (
        <p className="relative mt-3 rounded-lg bg-ink-950/60 px-3 py-2 text-sm text-ink-300">
          {legacySpecs}
        </p>
      ) : null}
    </div>
  );
}
