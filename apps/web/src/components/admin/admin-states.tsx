"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Inbox, ShieldAlert } from "lucide-react";
import { ApiError } from "@/lib/api";
import { useT } from "@/components/locale-provider";

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-slate-100" aria-busy="true">
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-3.5">
          {Array.from({ length: cols }, (_, c) => (
            <div
              key={c}
              className="h-3.5 animate-pulse rounded bg-slate-100"
              style={{ width: c === 0 ? "22%" : `${10 + ((r + c) % 3) * 4}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <Inbox className="h-5 w-5" />
      </span>
      <p className="text-sm font-medium text-slate-900">{title}</p>
      {hint ? <p className="text-sm text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) {
  const t = useT();
  const router = useRouter();
  const status = error instanceof ApiError ? error.status : null;

  useEffect(() => {
    if (status === 401) router.replace("/login");
  }, [status, router]);

  if (status === 401 || status === 403) {
    return (
      <StateBlock icon={<ShieldAlert className="h-5 w-5" />} title={t("dash.unauthorized")} />
    );
  }

  return (
    <StateBlock
      icon={<AlertCircle className="h-5 w-5" />}
      title={t("dash.loadError")}
      hint={error instanceof Error ? error.message : undefined}
      action={
        onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {t("dash.retry")}
          </button>
        ) : null
      }
    />
  );
}

function StateBlock({
  icon,
  title,
  hint,
  action,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
        {icon}
      </span>
      <p className="text-sm font-medium text-slate-900">{title}</p>
      {hint ? <p className="text-sm text-slate-500">{hint}</p> : null}
      {action}
    </div>
  );
}
