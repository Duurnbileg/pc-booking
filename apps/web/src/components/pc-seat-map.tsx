"use client";

import { useQuery } from "@tanstack/react-query";
import { API_PATHS, type PcStatus } from "@pc-booking/shared";
import { api } from "@/lib/api";
import type { CafePc } from "@/lib/types";
import { cn, formatMnt } from "@/lib/utils";
import { useLocale } from "@/components/locale-provider";
import { PC_STATUS_META, PcStatusLegend } from "@/components/pc-status";
import { SeatMapSkeleton } from "@/components/skeletons";

type PcsResponse = {
  pcs: CafePc[];
  summary: {
    total: number;
    available: number;
    inUse: number;
    reserved: number;
    offline: number;
  };
};

const REFRESH_MS = 15_000;

function groupByZone(pcs: CafePc[]): [string, CafePc[]][] {
  const zones = new Map<string, CafePc[]>();
  for (const pc of pcs) {
    const zone = pc.zone ?? "—";
    zones.set(zone, [...(zones.get(zone) ?? []), pc]);
  }
  return [...zones.entries()];
}

export function PcSeatMap({ slug }: { slug: string }) {
  const { t } = useLocale();
  const { data, isLoading, error } = useQuery({
    queryKey: ["cafe-pcs", slug],
    queryFn: () => api<PcsResponse>(API_PATHS.cafes.pcs(slug)),
    refetchInterval: REFRESH_MS,
  });

  return (
    <section className="space-y-4 rounded-2xl border border-ink-800 bg-ink-900/50 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-ink-100">{t("seat.title")}</h2>
          <p className="text-xs text-ink-500">{t("seat.mockHint")}</p>
        </div>
        {data?.summary.total ? (
          <p className="text-sm font-medium text-status-available">
            {t("seat.availableCount", {
              a: data.summary.available,
              t: data.summary.total,
            })}
          </p>
        ) : null}
      </div>

      {isLoading ? (
        <SeatMapSkeleton />
      ) : error ? (
        <p className="text-sm text-status-reserved">{t("seat.loadError")}</p>
      ) : !data?.pcs.length ? (
        <p className="text-sm text-ink-500">{t("seat.notConnected")}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard status="AVAILABLE" count={data.summary.available} />
            <SummaryCard status="IN_USE" count={data.summary.inUse} />
            <SummaryCard status="RESERVED" count={data.summary.reserved} />
            <SummaryCard status="OFFLINE" count={data.summary.offline} />
          </div>

          {groupByZone(data.pcs).map(([zone, pcs]) => (
            <div key={zone} className="space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-sm font-semibold text-ink-100">{zone}</h3>
                {pcs[0]?.pricePerHour ? (
                  <span className="text-xs text-ink-500">
                    {formatMnt(pcs[0].pricePerHour)}
                    {t("home.perHour")}
                  </span>
                ) : null}
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-8">
                {pcs.map((pc) => (
                  <SeatTile key={pc.id} pc={pc} />
                ))}
              </div>
            </div>
          ))}

          <PcStatusLegend />
        </>
      )}
    </section>
  );
}

function SummaryCard({ status, count }: { status: PcStatus; count: number }) {
  const { t } = useLocale();
  const meta = PC_STATUS_META[status];
  return (
    <div className={cn("rounded-xl border px-3 py-2.5", meta.className)}>
      <p className="text-2xl font-semibold">{count}</p>
      <p className="text-xs opacity-90">{t(`seat.${status}`)}</p>
    </div>
  );
}

function SeatTile({ pc }: { pc: CafePc }) {
  const { t } = useLocale();
  const meta = PC_STATUS_META[pc.status];
  const bookable = pc.status === "AVAILABLE";
  const gpu = pc.specifications?.gpu;
  return (
    <div
      title={[
        pc.name,
        t(`seat.${pc.status}`),
        gpu,
        bookable ? t("seat.bookable") : null,
      ]
        .filter(Boolean)
        .join(" · ")}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 rounded-lg border px-1 py-2 text-center transition",
        meta.className,
        bookable ? "cursor-pointer hover:bg-status-available/20" : "opacity-80",
      )}
    >
      <MonitorIcon />
      <span className="text-xs font-semibold">{pc.name}</span>
      {gpu ? <span className="truncate text-[10px] opacity-80">{gpu}</span> : null}
    </div>
  );
}

function MonitorIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}
