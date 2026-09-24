"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { API_PATHS } from "@pc-booking/shared";
import { api } from "@/lib/api";
import type { Cafe, CafePc } from "@/lib/types";
import { formatMnt, cn } from "@/lib/utils";
import { PcStatusBadge, PcStatusLegend } from "@/components/pc-status";

export default function CafeDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const cafeQuery = useQuery({
    queryKey: ["cafe", slug],
    queryFn: () => api<{ cafe: Cafe }>(API_PATHS.cafes.byId(slug)),
  });

  const cafe = cafeQuery.data?.cafe;

  const pcsQuery = useQuery({
    queryKey: ["pcs", cafe?.id],
    enabled: Boolean(cafe?.id),
    queryFn: () => api<{ pcs: CafePc[] }>(API_PATHS.cafes.pcs(cafe!.id)),
  });

  if (cafeQuery.isLoading) {
    return <p className="text-ink-500">Loading cafe…</p>;
  }

  if (cafeQuery.error || !cafe) {
    return (
      <div className="space-y-3">
        <p className="text-status-reserved">Cafe not found.</p>
        <Link href="/" className="text-accent hover:underline">
          ← Back to discovery
        </Link>
      </div>
    );
  }

  const pcs = pcsQuery.data?.pcs ?? [];
  const available = pcs.filter((p) => p.status === "AVAILABLE").length;

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <Link href="/" className="text-sm text-ink-500 hover:text-ink-300">
          ← Discover
        </Link>
        <h1 className="font-display text-4xl tracking-tight">{cafe.name}</h1>
        <p className="max-w-2xl text-ink-300">{cafe.description}</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-400">
          <span>{cafe.address}</span>
          <span>{cafe.phone}</span>
          <span>
            {cafe.pcCount ?? pcs.length} PCs · {available} available now
          </span>
          <span className="text-accent font-medium">
            {formatMnt(cafe.pricePerHour)} / hour
          </span>
        </div>
        <button
          type="button"
          disabled
          title="Booking arrives in Phase 3"
          className="mt-2 rounded-lg border border-ink-700 px-4 py-2 text-sm text-ink-500 cursor-not-allowed"
        >
          Book Now (coming soon)
        </button>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-display text-2xl">PC Availability</h2>
          <PcStatusLegend />
        </div>

        {pcsQuery.isLoading ? (
          <p className="text-ink-500">Loading PCs…</p>
        ) : pcs.length === 0 ? (
          <p className="text-ink-500">No PCs listed for this cafe yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {pcs.map((pc) => (
              <div
                key={pc.id}
                className={cn(
                  "rounded-lg border border-ink-800 bg-ink-900/50 p-3 space-y-2",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-ink-100">{pc.name}</p>
                  {pc.zone ? (
                    <span className="text-[10px] uppercase tracking-wide text-ink-500">
                      {pc.zone}
                    </span>
                  ) : null}
                </div>
                <PcStatusBadge status={pc.status} />
                {pc.specifications?.gpu ? (
                  <p className="text-xs text-ink-500 truncate">
                    {pc.specifications.gpu}
                    {pc.specifications.ram ? ` · ${pc.specifications.ram}GB` : ""}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      {cafe.openingHours?.length ? (
        <section className="space-y-2">
          <h2 className="font-display text-xl">Opening hours</h2>
          <ul className="text-sm text-ink-400 grid sm:grid-cols-2 gap-1">
            {cafe.openingHours.map((h) => (
              <li key={h.day}>
                {dayName(h.day)}:{" "}
                {h.closed ? "Closed" : `${h.open} – ${h.close}`}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function dayName(day: number) {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day] ?? String(day);
}
