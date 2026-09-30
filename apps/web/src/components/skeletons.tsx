"use client";

import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/components/locale-provider";
import { cn } from "@/lib/utils";

function LoadingRegion({ className, children }: { className?: string; children: ReactNode }) {
  const t = useT();
  return (
    <div aria-busy="true" aria-live="polite" className={className}>
      <span className="sr-only">{t("common.loading")}</span>
      {children}
    </div>
  );
}

function repeat(count: number) {
  return Array.from({ length: count }, (_, i) => i);
}

export function CafeCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-800 bg-ink-900/50">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <Skeleton className="h-6 w-2/5" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="mt-1 h-4 w-24" />
      </div>
    </div>
  );
}

export function CafeGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <LoadingRegion className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {repeat(count).map((i) => (
        <CafeCardSkeleton key={i} />
      ))}
    </LoadingRegion>
  );
}

export function ResultCardSkeleton() {
  return (
    <div className="grid overflow-hidden rounded-2xl border border-ink-800 bg-ink-900/50 sm:grid-cols-[240px_1fr]">
      <Skeleton className="aspect-[4/3] w-full rounded-none sm:aspect-auto sm:min-h-[200px]" />
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:justify-between">
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-6 w-36 rounded-full" />
        </div>
        <div className="flex shrink-0 flex-row items-end justify-between gap-3 sm:flex-col">
          <div className="space-y-1.5">
            <Skeleton className="ml-auto h-8 w-24" />
            <Skeleton className="ml-auto h-3 w-10" />
          </div>
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function ResultListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <LoadingRegion className="space-y-4">
      {repeat(count).map((i) => (
        <ResultCardSkeleton key={i} />
      ))}
    </LoadingRegion>
  );
}

/** Inner content of the seat map section (summary boxes + seat tiles). */
export function SeatMapSkeleton() {
  return (
    <LoadingRegion className="space-y-5">
      <div className="space-y-3">
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex flex-wrap gap-5">
          {repeat(2).map((i) => (
            <Skeleton key={i} className="h-3 w-24" />
          ))}
        </div>
      </div>
      <Skeleton className="h-4 w-16" />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] gap-1.5">
        {repeat(24).map((i) => (
          <Skeleton key={i} className="h-9 rounded-lg" />
        ))}
      </div>
    </LoadingRegion>
  );
}

export function CafeDetailSkeleton() {
  return (
    <LoadingRegion className="space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-2/3 sm:w-1/3" />
      <Skeleton className="h-5 w-full max-w-2xl" />
      <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="max-w-2xl space-y-1.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-3">
        {repeat(3).map((i) => (
          <Skeleton key={i} className="aspect-[4/3] w-full rounded-xl" />
        ))}
      </div>
      <div className="space-y-4 rounded-2xl border border-ink-800 bg-ink-900/50 p-5">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-3 w-72 max-w-full" />
        </div>
        <SeatMapSkeleton />
      </div>
    </LoadingRegion>
  );
}

/** Matches the owner cafe list and the admin pending list rows. */
export function ListRowsSkeleton({
  rows = 3,
  actions = 1,
}: {
  rows?: number;
  actions?: number;
}) {
  return (
    <LoadingRegion className="divide-y divide-ink-800 border-y border-ink-800">
      {repeat(rows).map((i) => (
        <div
          key={i}
          className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center"
        >
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <div className="flex gap-2">
            {repeat(actions).map((a) => (
              <Skeleton key={a} className="h-9 w-24 rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </LoadingRegion>
  );
}

export function PageSkeleton({ className }: { className?: string }) {
  return (
    <LoadingRegion className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <Skeleton className="h-4 w-80 max-w-full" />
      <div className="space-y-3">
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    </LoadingRegion>
  );
}
