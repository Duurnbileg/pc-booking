"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { API_PATHS } from "@pc-booking/shared";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import type { Cafe } from "@/lib/types";
import { useT } from "@/components/locale-provider";
import {
  CafeFormFields,
  buildCafePayload,
  cafeToFormValues,
  emptyCafeForm,
  revokePending,
  type CafeFormValues,
} from "@/components/cafe-form";

export default function OwnerCafeDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const t = useT();
  const [form, setForm] = useState<CafeFormValues>(emptyCafeForm);
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
    queryFn: () => api<{ cafe: Cafe }>(`${API_PATHS.owner.myCafes}/${params.id}`),
  });

  useEffect(() => {
    if (data?.cafe) {
      revokePending(form.pendingImages);
      setForm(cafeToFormValues(data.cafe));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.cafe?.id, data?.cafe?.updatedAt]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!data?.cafe) return;
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const payload = await buildCafePayload(form, t);
      await api(API_PATHS.cafes.byId(data.cafe.id), {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      revokePending(form.pendingImages);
      setMessage(t("owner.saved"));
      await queryClient.invalidateQueries({ queryKey: ["owner-cafe", params.id] });
      await queryClient.invalidateQueries({ queryKey: ["owner-cafes"] });
      await queryClient.invalidateQueries({ queryKey: ["cafes"] });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("owner.saveFailed"));
    } finally {
      setPending(false);
    }
  }

  if (loading || isLoading || !data) {
    return <p className="text-ink-500">{t("owner.loading")}</p>;
  }

  const { cafe } = data;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <Link href="/owner" className="text-sm text-ink-500 hover:text-ink-300">
          {t("owner.back")}
        </Link>
        <h1 className="font-display text-3xl">{cafe.name}</h1>
        <p className="text-sm text-ink-500">
          {t("owner.status")} {cafe.status}
        </p>
      </div>

      <form onSubmit={onSave} className="space-y-5">
        <CafeFormFields value={form} onChange={setForm} disabled={pending} />
        {error ? <p className="text-sm text-status-reserved">{error}</p> : null}
        {message ? <p className="text-sm text-accent">{message}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-accent py-3 font-medium text-ink-950 hover:bg-accent-dim disabled:opacity-60"
        >
          {pending
            ? form.pendingImages.length
              ? t("owner.savingUpload")
              : t("owner.saving")
            : t("owner.save")}
        </button>
      </form>
    </div>
  );
}
