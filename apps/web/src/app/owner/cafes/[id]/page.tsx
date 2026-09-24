"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { API_PATHS } from "@pc-booking/shared";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { PcStatusBadge } from "@/components/pc-status";
import type { Cafe, CafePc } from "@/lib/types";
import { formatMnt } from "@/lib/utils";

export default function OwnerCafeDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [pricePerHour, setPricePerHour] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!loading && (!user || (user.role !== "CAFE_OWNER" && user.role !== "ADMIN"))) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["owner-cafe", params.id],
    enabled: Boolean(user && params.id),
    queryFn: () =>
      api<{ cafe: Cafe; pcs: CafePc[] }>(`${API_PATHS.owner.myCafes}/${params.id}`),
  });

  useEffect(() => {
    if (data?.cafe) {
      setPricePerHour(data.cafe.pricePerHour);
      setDescription(data.cafe.description ?? "");
    }
  }, [data]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!data?.cafe) return;
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      await api(API_PATHS.cafes.byId(data.cafe.id), {
        method: "PATCH",
        body: JSON.stringify({
          pricePerHour: Number(pricePerHour),
          description,
        }),
      });
      setMessage("Saved");
      await queryClient.invalidateQueries({ queryKey: ["owner-cafe", params.id] });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  if (loading || isLoading || !data) {
    return <p className="text-ink-500">Loading…</p>;
  }

  const { cafe, pcs } = data;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Link href="/owner" className="text-sm text-ink-500 hover:text-ink-300">
          ← My cafes
        </Link>
        <h1 className="font-display text-3xl">{cafe.name}</h1>
        <p className="text-sm text-ink-500">
          Status: <span className="text-ink-200">{cafe.status}</span>
          {cafe.status === "APPROVED" ? (
            <>
              {" "}
              ·{" "}
              <Link href={`/cafes/${cafe.slug}`} className="text-accent hover:underline">
                Public page
              </Link>
            </>
          ) : (
            " · Waiting for admin approval"
          )}
        </p>
      </div>

      <form onSubmit={onSave} className="space-y-4 max-w-lg">
        <label className="block space-y-1.5 text-sm">
          <span className="text-ink-300">Price / hour (₮)</span>
          <input
            type="number"
            min={0}
            value={pricePerHour}
            onChange={(e) => setPricePerHour(Number(e.target.value))}
            className="w-full rounded-lg border border-ink-700 bg-ink-900/80 px-3 py-2.5"
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="text-ink-300">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full min-h-[96px] rounded-lg border border-ink-700 bg-ink-900/80 px-3 py-2.5"
          />
        </label>
        {error ? <p className="text-sm text-status-reserved">{error}</p> : null}
        {message ? <p className="text-sm text-accent">{message}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-ink-950 hover:bg-accent-dim disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="font-display text-xl">
          PCs ({pcs.length}) · from {formatMnt(cafe.pricePerHour)}/hr
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {pcs.map((pc) => (
            <div
              key={pc.id}
              className="rounded-lg border border-ink-800 bg-ink-900/50 p-3 space-y-2"
            >
              <p className="font-medium">{pc.name}</p>
              <PcStatusBadge status={pc.status} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
