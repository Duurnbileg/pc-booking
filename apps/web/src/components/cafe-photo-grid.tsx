"use client";

import { useEffect, useState } from "react";
import { Grid3x3, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/locale-provider";
import { ImageWithSkeleton } from "@/components/image-with-skeleton";

const MOSAIC_SIZE = 5;

export function CafePhotoGrid({ images, name }: { images: string[]; name: string }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  if (!images.length) return null;

  const [first, ...others] = images;
  const rest = others.length >= MOSAIC_SIZE - 1 ? others.slice(0, 4) : others.slice(0, 2);

  return (
    <>
      <div
        className={cn(
          "relative grid h-64 gap-2 overflow-hidden rounded-2xl sm:h-[420px]",
          rest.length === 4 && "sm:grid-cols-4 sm:grid-rows-2",
          rest.length === 2 && "sm:grid-cols-3 sm:grid-rows-2",
          rest.length === 1 && "sm:grid-cols-2",
        )}
      >
        <Tile
          src={first!}
          alt={name}
          onClick={() => setOpen(true)}
          className={cn(rest.length >= 2 && "sm:col-span-2 sm:row-span-2")}
        />
        {rest.map((src) => (
          <Tile
            key={src}
            src={src}
            alt=""
            onClick={() => setOpen(true)}
            className="hidden sm:block"
          />
        ))}

        {images.length > 1 ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-950/85 px-3 py-1.5 text-sm font-medium text-ink-100 backdrop-blur transition hover:border-accent hover:text-accent"
          >
            <Grid3x3 className="h-4 w-4" />
            {t("cafe.showAllPhotos", { n: images.length })}
          </button>
        ) : null}
      </div>

      {open ? <PhotoLightbox images={images} name={name} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function Tile({
  src,
  alt,
  onClick,
  className,
}: {
  src: string;
  alt: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("group relative overflow-hidden bg-ink-900", className)}
    >
      <ImageWithSkeleton
        src={src}
        alt={alt}
        className="transition-[opacity,filter] duration-300 group-hover:brightness-90"
      />
    </button>
  );
}

function PhotoLightbox({
  images,
  name,
  onClose,
}: {
  images: string[];
  name: string;
  onClose: () => void;
}) {
  const { t } = useLocale();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={name}
      className="fixed inset-0 z-50 overflow-y-auto bg-ink-950"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-800 bg-ink-950/90 px-4 py-3 backdrop-blur">
        <p className="truncate font-display text-lg text-ink-100">{name}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("cafe.closePhotos")}
          className="rounded-full p-2 text-ink-300 transition hover:bg-ink-800 hover:text-ink-100"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="mx-auto grid max-w-4xl gap-2 p-4 sm:grid-cols-2">
        {images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt=""
            className={cn(
              "w-full rounded-xl object-cover",
              i % 3 === 0 ? "aspect-[3/2] sm:col-span-2" : "aspect-square",
            )}
          />
        ))}
      </div>
    </div>
  );
}
