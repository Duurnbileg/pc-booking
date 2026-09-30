"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { BrandMark } from "@/components/brand-logo";
import { cn } from "@/lib/utils";

type ImageWithSkeletonProps = {
  src: string;
  alt: string;
  /** Classes for the <img> (object-fit, hover transforms, …). */
  className?: string;
  /** Rendered instead of the image if it fails to load. */
  fallback?: ReactNode;
};

export function CafeCoverFallback() {
  return (
    <div className="flex h-full items-center justify-center gap-2 bg-gradient-to-br from-ink-800 to-ink-950">
      <BrandMark size={28} className="opacity-50" />
      <span className="font-display text-2xl text-ink-500">
        Pick<span className="text-accent/50">PC</span>
      </span>
    </div>
  );
}

/** Fills its `relative` parent; shows a pulsing skeleton until the image has loaded. */
export function ImageWithSkeleton({ src, alt, className, fallback }: ImageWithSkeletonProps) {
  const ref = useRef<HTMLImageElement>(null);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  useEffect(() => {
    setStatus("loading");
    const img = ref.current;
    // Cached images can finish before React attaches onLoad.
    if (img?.complete) setStatus(img.naturalWidth > 0 ? "loaded" : "error");
  }, [src]);

  if (status === "error" && fallback) {
    return <div className="absolute inset-0">{fallback}</div>;
  }

  return (
    <>
      {status === "loading" ? (
        <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={ref}
        src={src}
        alt={alt}
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
          status === "loaded" ? "opacity-100" : "opacity-0",
          className,
        )}
      />
    </>
  );
}
