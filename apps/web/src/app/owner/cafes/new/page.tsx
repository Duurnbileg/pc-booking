"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_PATHS } from "@pc-booking/shared";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import type { Cafe } from "@/lib/types";
import { useT } from "@/components/locale-provider";
import {
  CafeFormFields,
  buildCafePayload,
  emptyCafeForm,
  revokePending,
  type CafeFormValues,
} from "@/components/cafe-form";

export default function NewCafePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const t = useT();
  const [form, setForm] = useState<CafeFormValues>(emptyCafeForm);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!loading && (!user || (user.role !== "CAFE_OWNER" && user.role !== "ADMIN"))) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    return () => revokePending(form.pendingImages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const payload = await buildCafePayload(form, t);
      const data = await api<{ cafe: Cafe }>(API_PATHS.cafes.list, {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          location: { lng: 106.917, lat: 47.918 },
        }),
      });
      revokePending(form.pendingImages);
      router.push(`/owner/cafes/${data.cafe.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("owner.createFailed"));
    } finally {
      setPending(false);
    }
  }

  if (loading || !user) {
    return <p className="text-ink-500">{t("owner.loading")}</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-3xl">{t("owner.registerTitle")}</h1>
      <p className="text-sm text-ink-500">{t("owner.registerHint")}</p>
      <form onSubmit={onSubmit} className="space-y-5">
        <CafeFormFields value={form} onChange={setForm} disabled={pending} />
        {error ? <p className="text-sm text-status-reserved">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-accent py-3 font-medium text-ink-950 hover:bg-accent-dim disabled:opacity-60"
        >
          {pending
            ? form.pendingImages.length
              ? t("owner.submittingUpload")
              : t("owner.submitting")
            : t("owner.submit")}
        </button>
      </form>
    </div>
  );
}
