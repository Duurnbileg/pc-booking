"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_PATHS } from "@pc-booking/shared";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import type { Cafe } from "@/lib/types";

export default function NewCafePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [pricePerHour, setPricePerHour] = useState(3000);
  const [pcCount, setPcCount] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!loading && (!user || (user.role !== "CAFE_OWNER" && user.role !== "ADMIN"))) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const pcs = Array.from({ length: Math.max(1, pcCount) }, (_, i) => ({
        name: `PC-${String(i + 1).padStart(2, "0")}`,
        zone: i < pcCount / 2 ? "Main" : "VIP",
        status: "AVAILABLE" as const,
        pricePerHour,
      }));

      const data = await api<{ cafe: Cafe }>(API_PATHS.cafes.list, {
        method: "POST",
        body: JSON.stringify({
          name,
          description,
          address,
          phone,
          pricePerHour,
          location: { lng: 106.917, lat: 47.918 },
          pcs,
        }),
      });
      router.push(`/owner/cafes/${data.cafe.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create cafe");
    } finally {
      setPending(false);
    }
  }

  if (loading || !user) {
    return <p className="text-ink-500">Loading…</p>;
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="font-display text-3xl">Register gaming center</h1>
      <p className="text-sm text-ink-500">
        New cafes start as <span className="text-ink-300">PENDING</span> until a
        platform admin approves them.
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Name">
          <input required value={name} onChange={(e) => setName(e.target.value)} className="field" />
        </Field>
        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="field min-h-[88px]"
          />
        </Field>
        <Field label="Address">
          <input required value={address} onChange={(e) => setAddress(e.target.value)} className="field" />
        </Field>
        <Field label="Phone">
          <input required value={phone} onChange={(e) => setPhone(e.target.value)} className="field" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Price / hour (₮)">
            <input
              type="number"
              min={0}
              required
              value={pricePerHour}
              onChange={(e) => setPricePerHour(Number(e.target.value))}
              className="field"
            />
          </Field>
          <Field label="Initial PC count">
            <input
              type="number"
              min={1}
              max={80}
              required
              value={pcCount}
              onChange={(e) => setPcCount(Number(e.target.value))}
              className="field"
            />
          </Field>
        </div>
        {error ? <p className="text-sm text-status-reserved">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-accent py-3 font-medium text-ink-950 hover:bg-accent-dim disabled:opacity-60"
        >
          {pending ? "Submitting…" : "Submit for approval"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="text-ink-300">{label}</span>
      <div className="[&_.field]:w-full [&_.field]:rounded-lg [&_.field]:border [&_.field]:border-ink-700 [&_.field]:bg-ink-900/80 [&_.field]:px-3 [&_.field]:py-2.5 [&_.field]:text-ink-100 [&_.field]:focus:border-accent">
        {children}
      </div>
    </label>
  );
}
