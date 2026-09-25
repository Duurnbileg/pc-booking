"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_PATHS } from "@pc-booking/shared";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import type { Cafe } from "@/lib/types";
import { formatMnt } from "@/lib/utils";
import { useT } from "@/components/locale-provider";
import {
  CafeFormFields,
  buildCafePayload,
  cafeToFormValues,
  emptyCafeForm,
  revokePending,
  type CafeFormValues,
} from "@/components/cafe-form";

function detailText(cafe: Cafe, fallback: string): string {
  const parts: string[] = [];
  if (cafe.address) parts.push(cafe.address);
  if (cafe.gear) parts.push(cafe.gear);
  if (cafe.displaySpecs) parts.push(cafe.displaySpecs);
  return parts.join(" · ") || cafe.description || fallback;
}

export default function AdminCafesCatalogPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useT();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Cafe | null>(null);
  const [form, setForm] = useState<CafeFormValues>(emptyCafeForm);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  const cafesQuery = useQuery({
    queryKey: ["admin-cafes"],
    enabled: user?.role === "ADMIN",
    queryFn: () => api<{ cafes: Cafe[] }>(API_PATHS.admin.cafes),
  });

  const cafes = cafesQuery.data?.cafes ?? [];
  const title = useMemo(
    () => (editing ? t("admin.editTitle") : t("admin.createTitle")),
    [editing, t],
  );

  function openCreate() {
    revokePending(form.pendingImages);
    setEditing(null);
    setForm(emptyCafeForm());
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(cafe: Cafe) {
    revokePending(form.pendingImages);
    setEditing(cafe);
    setForm(cafeToFormValues(cafe));
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    revokePending(form.pendingImages);
    setModalOpen(false);
    setEditing(null);
    setFormError(null);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = await buildCafePayload(form, t);
      if (editing) {
        return api<{ cafe: Cafe }>(API_PATHS.cafes.byId(editing.id), {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      }
      return api<{ cafe: Cafe }>(API_PATHS.cafes.list, {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          location: { lng: 106.917, lat: 47.918 },
        }),
      });
    },
    onSuccess: async () => {
      revokePending(form.pendingImages);
      await queryClient.invalidateQueries({ queryKey: ["admin-cafes"] });
      await queryClient.invalidateQueries({ queryKey: ["cafes"] });
      closeModal();
    },
    onError: (err) => {
      setFormError(err instanceof ApiError ? err.message : t("admin.saveFailed"));
    },
  });

  const suspendMutation = useMutation({
    mutationFn: async (id: string) => {
      await api(API_PATHS.admin.suspendCafe(id), { method: "POST" });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-cafes"] });
      await queryClient.invalidateQueries({ queryKey: ["cafes"] });
      closeModal();
    },
    onError: (err) => {
      setFormError(err instanceof ApiError ? err.message : t("admin.suspendFailed"));
    },
  });

  if (loading || !user) {
    return <p className="text-ink-500">{t("admin.loading")}</p>;
  }

  const saving = saveMutation.isPending;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-tight">
            {t("admin.catalogTitle")}
          </h1>
          <p className="mt-1 text-sm text-ink-500">{t("admin.catalogHint")}</p>
        </div>
        <Link
          href="/admin/cafes"
          className="text-sm text-ink-300 hover:text-accent transition"
        >
          {t("admin.pendingLink")}
        </Link>
      </div>

      {cafesQuery.isLoading ? (
        <p className="text-ink-500">{t("admin.loadingCafes")}</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <button
            type="button"
            onClick={openCreate}
            className="group flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-accent/40 bg-ink-900/40 px-6 py-10 text-center transition hover:border-accent hover:bg-ink-900/70"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-3xl font-light text-ink-950 transition group-hover:scale-105">
              +
            </span>
            <span className="font-display text-lg text-ink-100">{t("admin.addNew")}</span>
            <span className="text-sm text-ink-500">{t("admin.addHint")}</span>
          </button>

          {cafes.map((cafe) => {
            const cover = cafe.images[0];
            return (
              <article
                key={cafe.id}
                className="overflow-hidden rounded-2xl border border-ink-800 bg-ink-900/50 shadow-[0_12px_40px_rgba(0,0,0,0.25)]"
              >
                <div className="relative aspect-[4/3] bg-ink-800">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cover}
                      alt={cafe.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-ink-500">
                      {t("home.noImage")}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => openEdit(cafe)}
                    aria-label={cafe.name}
                    className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-ink-950/90 text-accent shadow-lg ring-1 ring-ink-700 transition hover:bg-ink-950"
                  >
                    <PencilIcon />
                  </button>
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-display text-lg text-accent">{cafe.name}</h2>
                    <p className="shrink-0 text-sm font-medium text-ink-100">
                      {formatMnt(cafe.pricePerHour)}
                      <span className="text-ink-500">{t("home.perHour")}</span>
                    </p>
                  </div>
                  <p className="text-xs uppercase tracking-wide text-ink-500">
                    {cafe.status} · {t("home.pcs", { n: cafe.pcCount ?? 0 })}
                  </p>
                  <p className="line-clamp-3 text-sm leading-relaxed text-ink-300">
                    {detailText(cafe, t("cafe.noDetails"))}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink-950/80 p-0 sm:p-6 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-ink-800 bg-ink-900 shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-ink-800 bg-ink-900/95 px-5 py-4 backdrop-blur">
              <h2 className="font-display text-2xl tracking-tight">{title}</h2>
              <button
                type="button"
                onClick={closeModal}
                aria-label={t("admin.close")}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-700 text-ink-300 hover:text-ink-100"
              >
                ×
              </button>
            </div>

            <form
              className="space-y-5 px-5 py-6"
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate();
              }}
            >
              <CafeFormFields
                value={form}
                onChange={setForm}
                disabled={saving || suspendMutation.isPending}
              />

              {formError ? (
                <p className="text-sm text-status-reserved">{formError}</p>
              ) : null}

              <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 border-t border-ink-800 pt-4">
                {editing && editing.status === "APPROVED" ? (
                  <button
                    type="button"
                    disabled={suspendMutation.isPending}
                    onClick={() => {
                      if (confirm(t("admin.suspendConfirm"))) {
                        suspendMutation.mutate(editing.id);
                      }
                    }}
                    className="rounded-xl border border-status-reserved/50 px-4 py-2.5 text-sm text-status-reserved hover:bg-status-reserved/10 disabled:opacity-60"
                  >
                    {suspendMutation.isPending
                      ? t("admin.suspending")
                      : t("admin.suspend")}
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-ink-950 hover:bg-accent-dim disabled:opacity-60"
                >
                  {saving
                    ? form.pendingImages.length
                      ? t("admin.savingUpload")
                      : t("admin.saving")
                    : editing
                      ? t("admin.save")
                      : t("admin.add")}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PencilIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
