"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { API_PATHS } from "@pc-booking/shared";
import { api } from "@/lib/api";
import type { Cafe } from "@/lib/types";
import { formatMnt } from "@/lib/utils";

export default function HomePage() {
  const [q, setQ] = useState("");
  const [submitted, setSubmitted] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["cafes", submitted],
    queryFn: () =>
      api<{ cafes: Cafe[] }>(
        `${API_PATHS.cafes.list}${submitted ? `?q=${encodeURIComponent(submitted)}` : ""}`,
      ),
  });

  const cafes = data?.cafes ?? [];
  const subtitle = useMemo(() => {
    if (submitted) return `Results for “${submitted}”`;
    return "Popular gaming centers in Ulaanbaatar";
  }, [submitted]);

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <p className="font-display text-4xl sm:text-5xl tracking-tight text-ink-100">
          PC<span className="text-accent">Book</span>
        </p>
        <h1 className="text-xl text-ink-300 max-w-xl">
          Find a gaming center, check live PC availability, and book a seat.
        </h1>
        <form
          className="flex flex-col sm:flex-row gap-2 max-w-xl"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(q.trim());
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search gaming center…"
            className="flex-1 rounded-lg border border-ink-700 bg-ink-900/80 px-4 py-3 text-ink-100 placeholder:text-ink-500 focus:border-accent"
          />
          <button
            type="submit"
            className="rounded-lg bg-accent px-5 py-3 font-medium text-ink-950 hover:bg-accent-dim transition"
          >
            Search
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl text-ink-100">{subtitle}</h2>
          <span className="text-sm text-ink-500">{cafes.length} centers</span>
        </div>

        {isLoading ? (
          <p className="text-ink-500">Loading cafes…</p>
        ) : error ? (
          <p className="text-status-reserved">
            Could not load cafes. Is the API running on port 4000?
          </p>
        ) : cafes.length === 0 ? (
          <p className="text-ink-500">No approved gaming centers found.</p>
        ) : (
          <ul className="divide-y divide-ink-800 border-y border-ink-800">
            {cafes.map((cafe) => (
              <li key={cafe.id}>
                <Link
                  href={`/cafes/${cafe.slug}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-5 hover:bg-ink-900/40 -mx-2 px-2 rounded transition"
                >
                  <div>
                    <p className="font-display text-lg text-ink-100">{cafe.name}</p>
                    <p className="text-sm text-ink-500">{cafe.address}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-ink-300">
                    <span>{cafe.pcCount ?? "—"} PCs</span>
                    <span className="text-accent font-medium">
                      {formatMnt(cafe.pricePerHour)} / hour
                    </span>
                    <span className="text-ink-100">View →</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
