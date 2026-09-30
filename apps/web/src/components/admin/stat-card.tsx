import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: number | undefined;
  icon: LucideIcon;
  loading?: boolean;
};

export function StatCard({ label, value, icon: Icon, loading }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <Icon className="h-4 w-4 text-slate-400" aria-hidden />
      </div>
      {loading || value === undefined ? (
        <div className="mt-3 h-7 w-20 animate-pulse rounded bg-slate-100" />
      ) : (
        <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">
          {value.toLocaleString("en-US")}
        </p>
      )}
    </div>
  );
}
