"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { API_PATHS } from "@pc-booking/shared";
import { api, ApiError } from "@/lib/api";
import { useT } from "@/components/locale-provider";
import { Drawer } from "@/components/admin/drawer";
import {
  CafeFormFields,
  buildCafePayload,
  cafeToFormValues,
  emptyCafeForm,
  revokePending,
  type CafeFormValues,
} from "@/components/cafe-form";
import type { AdminCafe, Cafe } from "@/lib/types";

const DEFAULT_LOCATION = { lng: 106.917, lat: 47.918 };

/** `cafe === undefined` means closed, `null` means creating a new cafe. */
export function CafeEditorDrawer({
  cafe,
  onClose,
  onSaved,
}: {
  cafe: AdminCafe | null | undefined;
  onClose: () => void;
  onSaved: (created: boolean) => void;
}) {
  const t = useT();
  const open = cafe !== undefined;
  const [form, setForm] = useState<CafeFormValues>(emptyCafeForm);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(cafe ? cafeToFormValues(cafe) : emptyCafeForm());
    setError(null);
  }, [open, cafe]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = await buildCafePayload(form, t);
      if (cafe) {
        return api<{ cafe: Cafe }>(API_PATHS.cafes.byId(cafe.id), {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      }
      return api<{ cafe: Cafe }>(API_PATHS.cafes.list, {
        method: "POST",
        body: JSON.stringify({ ...payload, location: payload.location ?? DEFAULT_LOCATION }),
      });
    },
    onSuccess: () => {
      revokePending(form.pendingImages);
      onSaved(!cafe);
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : t("admin.saveFailed"));
    },
  });

  function close() {
    if (save.isPending) return;
    revokePending(form.pendingImages);
    onClose();
  }

  return (
    <Drawer
      open={open}
      width="lg"
      title={cafe ? t("dash.editTitle") : t("dash.createTitle")}
      onClose={close}
      footer={
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-sm text-red-600">{error}</p>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={close}
              disabled={save.isPending}
              className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {t("dash.cancel")}
            </button>
            <button
              type="submit"
              form="admin-cafe-form"
              disabled={save.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {save.isPending ? t("dash.saving") : t("dash.save")}
            </button>
          </div>
        </div>
      }
    >
      <form
        id="admin-cafe-form"
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          save.mutate();
        }}
      >
        <CafeFormFields
          value={form}
          onChange={setForm}
          disabled={save.isPending}
          variant="light"
        />
      </form>
    </Drawer>
  );
}
