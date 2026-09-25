"use client";

import { useMemo } from "react";
import { API_PATHS, defaultOpeningHours, type OpeningHours } from "@pc-booking/shared";
import { apiUpload, ApiError } from "@/lib/api";
import type { Cafe } from "@/lib/types";
import { useLocale } from "@/components/locale-provider";
import type { TranslationKey } from "@/lib/i18n/dictionaries";

export type CafeFormValues = {
  name: string;
  description: string;
  address: string;
  phone: string;
  pricePerHour: string;
  pcCount: string;
  gear: string;
  displaySpecs: string;
  existingImages: string[];
  pendingImages: PendingImage[];
  openingHours: OpeningHours[];
};

export type PendingImage = {
  id: string;
  file: File;
  previewUrl: string;
};

export function emptyCafeForm(): CafeFormValues {
  return {
    name: "",
    description: "",
    address: "",
    phone: "",
    pricePerHour: "3000",
    pcCount: "10",
    gear: "",
    displaySpecs: "",
    existingImages: [],
    pendingImages: [],
    openingHours: defaultOpeningHours(),
  };
}

export function cafeToFormValues(cafe: Cafe): CafeFormValues {
  return {
    name: cafe.name,
    description: cafe.description ?? "",
    address: cafe.address,
    phone: cafe.phone,
    pricePerHour: String(cafe.pricePerHour),
    pcCount: String(cafe.pcCount ?? 0),
    gear: cafe.gear ?? "",
    displaySpecs: cafe.displaySpecs ?? "",
    existingImages: cafe.images ?? [],
    pendingImages: [],
    openingHours:
      cafe.openingHours?.length === 7
        ? cafe.openingHours.map((h) => ({ ...h }))
        : defaultOpeningHours(),
  };
}

export function revokePending(images: PendingImage[]) {
  images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
}

type Translate = (
  key: TranslationKey,
  vars?: Record<string, string | number>,
) => string;

export async function buildCafePayload(form: CafeFormValues, t: Translate) {
  const name = form.name.trim();
  const address = form.address.trim();
  const phone = form.phone.trim();
  const pricePerHour = Number(form.pricePerHour);
  const pcCount = Number(form.pcCount);

  if (!name) throw new ApiError(t("form.errName"), 400);
  if (!address) throw new ApiError(t("form.errAddress"), 400);
  if (!phone) throw new ApiError(t("form.errPhone"), 400);
  if (!Number.isFinite(pricePerHour) || pricePerHour < 0) {
    throw new ApiError(t("form.errPrice"), 400);
  }
  if (!Number.isFinite(pcCount) || pcCount < 0 || !Number.isInteger(pcCount)) {
    throw new ApiError(t("form.errPcCount"), 400);
  }

  let uploadedUrls: string[] = [];
  if (form.pendingImages.length) {
    const body = new FormData();
    form.pendingImages.forEach((img) => body.append("images", img.file));
    const result = await apiUpload<{ urls: string[] }>(API_PATHS.upload, body);
    uploadedUrls = result.urls;
  }

  return {
    name,
    description: form.description.trim() || undefined,
    address,
    phone,
    pricePerHour,
    pcCount,
    gear: form.gear.trim() || undefined,
    displaySpecs: form.displaySpecs.trim() || undefined,
    images: [...form.existingImages, ...uploadedUrls],
    openingHours: form.openingHours,
  };
}

type CafeFormProps = {
  value: CafeFormValues;
  onChange: (next: CafeFormValues) => void;
  disabled?: boolean;
};

export function CafeFormFields({ value, onChange, disabled }: CafeFormProps) {
  const { t, days } = useLocale();

  const previewItems = useMemo(
    () => [
      ...value.existingImages.map((url) => ({
        key: url,
        src: url,
        kind: "existing" as const,
      })),
      ...value.pendingImages.map((img) => ({
        key: img.id,
        src: img.previewUrl,
        kind: "pending" as const,
      })),
    ],
    [value.existingImages, value.pendingImages],
  );

  function set<K extends keyof CafeFormValues>(key: K, v: CafeFormValues[K]) {
    onChange({ ...value, [key]: v });
  }

  function onPickImages(files: FileList | null) {
    if (!files?.length) return;
    const next: PendingImage[] = Array.from(files).map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    set("pendingImages", [...value.pendingImages, ...next]);
  }

  function removePreview(key: string, kind: "existing" | "pending") {
    if (kind === "existing") {
      set(
        "existingImages",
        value.existingImages.filter((url) => url !== key),
      );
      return;
    }
    const target = value.pendingImages.find((img) => img.id === key);
    if (target) URL.revokeObjectURL(target.previewUrl);
    set(
      "pendingImages",
      value.pendingImages.filter((img) => img.id !== key),
    );
  }

  function updateHour(day: number, patch: Partial<OpeningHours>) {
    set(
      "openingHours",
      value.openingHours.map((h) => (h.day === day ? { ...h, ...patch } : h)),
    );
  }

  const inputClass =
    "w-full rounded-xl border border-ink-700 bg-ink-950/80 px-3 py-2.5 text-ink-100 disabled:opacity-60";

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-ink-100">{t("form.cafeName")}</span>
          <input
            required
            disabled={disabled}
            value={value.name}
            onChange={(e) => set("name", e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-ink-100">
            {t("form.pricePerHour")}
          </span>
          <input
            required
            disabled={disabled}
            inputMode="numeric"
            value={value.pricePerHour}
            onChange={(e) => set("pricePerHour", e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-ink-100">{t("form.pcCount")}</span>
          <input
            required
            disabled={disabled}
            inputMode="numeric"
            min={0}
            value={value.pcCount}
            onChange={(e) => set("pcCount", e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-ink-100">{t("form.phone")}</span>
          <input
            required
            disabled={disabled}
            value={value.phone}
            onChange={(e) => set("phone", e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink-100">{t("form.address")}</span>
        <input
          required
          disabled={disabled}
          value={value.address}
          onChange={(e) => set("address", e.target.value)}
          className={inputClass}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink-100">{t("form.description")}</span>
        <textarea
          disabled={disabled}
          rows={2}
          value={value.description}
          onChange={(e) => set("description", e.target.value)}
          className={inputClass}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink-100">{t("form.gear")}</span>
        <textarea
          disabled={disabled}
          rows={3}
          value={value.gear}
          onChange={(e) => set("gear", e.target.value)}
          placeholder={t("form.gearPlaceholder")}
          className={inputClass}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink-100">{t("form.specs")}</span>
        <textarea
          disabled={disabled}
          rows={3}
          value={value.displaySpecs}
          onChange={(e) => set("displaySpecs", e.target.value)}
          placeholder={t("form.specsPlaceholder")}
          className={inputClass}
        />
      </label>

      <div className="space-y-3">
        <span className="text-sm font-medium text-ink-100">{t("form.openingHours")}</span>
        <div className="space-y-2 rounded-xl border border-ink-800 p-3">
          {value.openingHours.map((h) => (
            <div
              key={h.day}
              className="grid grid-cols-[3rem_1fr_1fr_auto] items-center gap-2 text-sm"
            >
              <span className="text-ink-400">{days[h.day]}</span>
              <input
                type="time"
                disabled={disabled || h.closed}
                value={h.open}
                onChange={(e) => updateHour(h.day, { open: e.target.value })}
                className={inputClass}
              />
              <input
                type="time"
                disabled={disabled || h.closed}
                value={h.close}
                onChange={(e) => updateHour(h.day, { close: e.target.value })}
                className={inputClass}
              />
              <label className="flex items-center gap-1.5 text-ink-400 whitespace-nowrap">
                <input
                  type="checkbox"
                  disabled={disabled}
                  checked={Boolean(h.closed)}
                  onChange={(e) => updateHour(h.day, { closed: e.target.checked })}
                />
                {t("cafe.closed")}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <span className="text-sm font-medium text-ink-100">{t("form.images")}</span>
        <label className="block cursor-pointer">
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={disabled}
            onChange={(e) => {
              onPickImages(e.target.files);
              e.target.value = "";
            }}
          />
          {previewItems.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {previewItems.map((item) => (
                <div
                  key={item.key}
                  className="relative aspect-[4/3] overflow-hidden rounded-xl border border-ink-700 bg-ink-950"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.src}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removePreview(item.key, item.kind);
                    }}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-ink-950/90 text-ink-100"
                    aria-label={t("form.removeImage")}
                  >
                    ×
                  </button>
                </div>
              ))}
              <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed border-ink-700 text-sm text-ink-500 hover:border-accent hover:text-accent">
                {t("form.addMore")}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-ink-700 px-4 py-10 text-center text-sm text-ink-500 transition hover:border-accent hover:text-accent">
              {t("form.uploadHint")}
            </div>
          )}
        </label>
      </div>
    </div>
  );
}
