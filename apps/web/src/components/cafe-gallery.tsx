"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/locale-provider";
import { ImageWithSkeleton } from "@/components/image-with-skeleton";

export function CafeGallery({ images }: { images: string[] }) {
  const { t } = useLocale();
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setCanPrev(track.scrollLeft > 4);
    setCanNext(track.scrollLeft + track.clientWidth < track.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    window.addEventListener("resize", updateArrows);
    return () => window.removeEventListener("resize", updateArrows);
  }, [images, updateArrows]);

  function scroll(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth, behavior: "smooth" });
  }

  if (!images.length) return null;

  return (
    <div className="relative">
      <div
        ref={trackRef}
        onScroll={updateArrows}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((url) => (
          <div
            key={url}
            className="group relative aspect-[4/3] w-[85%] shrink-0 snap-start overflow-hidden rounded-xl border border-ink-800 bg-ink-900 sm:w-[calc((100%-1.5rem)/3)]"
          >
            <ImageWithSkeleton
              src={url}
              alt=""
              className="transition-[opacity,transform] duration-500 group-hover:scale-105"
            />
          </div>
        ))}
      </div>

      <GalleryArrow
        side="left"
        visible={canPrev}
        label={t("cafe.prevPhoto")}
        onClick={() => scroll(-1)}
      />
      <GalleryArrow
        side="right"
        visible={canNext}
        label={t("cafe.nextPhoto")}
        onClick={() => scroll(1)}
      />
    </div>
  );
}

function GalleryArrow({
  side,
  visible,
  label,
  onClick,
}: {
  side: "left" | "right";
  visible: boolean;
  label: string;
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      tabIndex={visible ? 0 : -1}
      className={cn(
        "absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-ink-950/80 text-ink-100 ring-1 ring-ink-700 backdrop-blur transition hover:text-accent hover:ring-accent",
        side === "left" ? "left-2" : "right-2",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
