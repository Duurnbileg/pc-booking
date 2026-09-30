"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_PATHS } from "@pc-booking/shared";
import { api, ApiError } from "@/lib/api";
import { useT } from "@/components/locale-provider";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { useToast } from "@/components/admin/toast";
import { ADMIN_KEYS } from "@/hooks/use-admin-queries";
import type { AdminCafe } from "@/lib/types";

export type ModerationAction = "approve" | "reject" | "delete";

type Request = { action: ModerationAction; cafe: AdminCafe };

export function useCafeModeration(options: { onDone?: (request: Request) => void } = {}) {
  const t = useT();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<Request | null>(null);

  const mutation = useMutation({
    mutationFn: async ({ action, cafe, reason }: Request & { reason?: string }) => {
      if (action === "approve") {
        await api(API_PATHS.admin.approveCafe(cafe.id), { method: "POST" });
      } else if (action === "reject") {
        await api(API_PATHS.admin.rejectCafe(cafe.id), {
          method: "POST",
          body: JSON.stringify({ reason: reason?.trim() || undefined }),
        });
      } else {
        await api(API_PATHS.admin.deleteCafe(cafe.id), { method: "DELETE" });
      }
    },
    onSuccess: async (_data, { action, cafe }) => {
      const messages = {
        approve: t("dash.approvedToast", { name: cafe.name }),
        reject: t("dash.rejectedToast", { name: cafe.name }),
        delete: t("dash.deletedToast", { name: cafe.name }),
      };
      toast.success(messages[action]);
      setPending(null);
      options.onDone?.({ action, cafe });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.cafes }),
        queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.stats }),
        queryClient.invalidateQueries({ queryKey: ["cafes"] }),
      ]);
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : t("dash.actionFailed"));
    },
  });

  const copy = pending
    ? {
        approve: {
          title: t("dash.approveTitle"),
          message: t("dash.approveMessage", { name: pending.cafe.name }),
          confirmLabel: t("dash.approve"),
        },
        reject: {
          title: t("dash.rejectTitle"),
          message: t("dash.rejectMessage", { name: pending.cafe.name }),
          confirmLabel: t("dash.reject"),
        },
        delete: {
          title: t("dash.deleteTitle"),
          message: t("dash.deleteMessage"),
          confirmLabel: t("dash.delete"),
        },
      }[pending.action]
    : null;

  const dialog = (
    <ConfirmDialog
      open={Boolean(pending)}
      title={copy?.title ?? ""}
      message={copy?.message ?? ""}
      confirmLabel={copy?.confirmLabel ?? ""}
      destructive={pending?.action === "delete" || pending?.action === "reject"}
      pending={mutation.isPending}
      inputLabel={pending?.action === "reject" ? t("dash.rejectReason") : undefined}
      inputPlaceholder={t("dash.rejectReasonPlaceholder")}
      onCancel={() => setPending(null)}
      onConfirm={(reason) => pending && mutation.mutate({ ...pending, reason })}
    />
  );

  return {
    request: (action: ModerationAction, cafe: AdminCafe) => setPending({ action, cafe }),
    dialog,
    busyId: mutation.isPending ? mutation.variables?.cafe.id ?? null : null,
  };
}
