"use client";

import { useMemo } from "react";
import { Crown, Monitor, X } from "lucide-react";
import {
  API_PATHS,
  DISTRICTS,
  type District,
  type PricingTier,
} from "@pc-booking/shared";
import { apiUpload, ApiError } from "@/lib/api";
import type { Cafe } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/locale-provider";
import {
  TIER_SPECS,
  TIER_STYLES,
  type TierVariant,
} from "@/components/cafe-pricing-cards";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import { LocationPicker } from "@/components/maps/location-picker";
import { cafeLatLng, type LatLng } from "@/components/maps/maps-provider";

export type CafeFormValues = {
  name: string;
  description: string;
  address: string;
  district: District | "";
  location: LatLng | null;
  phone: string;
  gear: string;
  hall: TierFormValues;
  hasVip: boolean;
  vip: TierFormValues;
  existingImages: string[];
  pendingImages: PendingImage[];
};

export type TierFormValues = {
  price: string;
  pcs: string;
  gpu: string;
  cpu: string;
  ram: string;
  monitor: string;
};

function emptyTier(price: string, pcs: string): TierFormValues {
  return { price, pcs, gpu: "", cpu: "", ram: "", monitor: "" };
}

function tierToForm(tier: PricingTier): TierFormValues {
  return {
    price: String(tier.price),
    pcs: String(tier.pcs ?? 0),
    gpu: tier.gpu,
    cpu: tier.cpu,
    ram: tier.ram,
    monitor: tier.monitor,
  };
}

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
    district: "",
    location: null,
    phone: "",
    gear: "",
    hall: emptyTier("3000", "20"),
    hasVip: false,
    vip: emptyTier("5000", "10"),
    existingImages: [],
    pendingImages: [],
  };
}

export function cafeToFormValues(cafe: Cafe): CafeFormValues {
  return {
    name: cafe.name,
    description: cafe.description ?? "",
    address: cafe.address,
    district: cafe.district ?? "",
    location: cafeLatLng(cafe.location),
    phone: cafe.phone,
    gear: cafe.gear ?? "",
    hall: cafe.pricing?.hall
      ? tierToForm(cafe.pricing.hall)
      : emptyTier(String(cafe.pricePerHour), String(cafe.pcCount ?? 0)),
    hasVip: Boolean(cafe.pricing?.vip),
    vip: cafe.pricing?.vip ? tierToForm(cafe.pricing.vip) : emptyTier("", "10"),
    existingImages: cafe.images ?? [],
    pendingImages: [],
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

  if (!name) throw new ApiError(t("form.errName"), 400);
  if (!address) throw new ApiError(t("form.errAddress"), 400);
  if (!phone) throw new ApiError(t("form.errPhone"), 400);
  if (!form.location) throw new ApiError(t("form.errLocation"), 400);
  const hall = parseTier(form.hall);
  if (!hall) throw new ApiError(t("form.errPrice"), 400);
  const vip = form.hasVip ? parseTier(form.vip) : null;
  if (form.hasVip && !vip) throw new ApiError(t("form.errVipPrice"), 400);
  if (Number.isNaN(hall.pcs) || (vip && Number.isNaN(vip.pcs))) {
    throw new ApiError(t("form.errPcCount"), 400);
  }
  const pcCount = hall.pcs + (vip?.pcs ?? 0);

  // One image per request keeps each body under Vercel's 4.5 MB limit.
  const uploadedUrls: string[] = [];
  for (const img of form.pendingImages) {
    const body = new FormData();
    body.append("images", img.file);
    const result = await apiUpload<{ urls: string[] }>(API_PATHS.upload, body);
    uploadedUrls.push(...result.urls);
  }

  return {
    name,
    description: form.description.trim() || undefined,
    address,
    district: form.district || undefined,
    location: form.location,
    phone,
    pcCount,
    gear: form.gear.trim() || undefined,
    pricing: { hall, vip },
    images: [...form.existingImages, ...uploadedUrls],
  };
}

/** Returns NaN for pcs when it is not a whole number ≥ 0, so the caller can report it. */
function parseTier(tier: TierFormValues): PricingTier | null {
  if (!tier.price.trim()) return null;
  const price = Number(tier.price);
  if (!Number.isFinite(price) || price < 0) return null;
  return {
    price,
    pcs: parsePcs(tier.pcs),
    gpu: tier.gpu.trim(),
    cpu: tier.cpu.trim(),
    ram: tier.ram.trim(),
    monitor: tier.monitor.trim(),
  };
}

function parsePcs(value: string): number {
  const pcs = Number(value.trim() || "0");
  return Number.isInteger(pcs) && pcs >= 0 ? pcs : Number.NaN;
}

type TierFieldsProps = {
  variant: TierVariant;
  value: TierFormValues;
  onChange: (next: TierFormValues) => void;
  onRemove?: () => void;
  disabled?: boolean;
  styles: FormStyles;
};

function TierFields({
  variant,
  value,
  onChange,
  onRemove,
  disabled,
  styles: s,
}: TierFieldsProps) {
  const { t } = useLocale();
  const inputClass = s.input;

  return (
    <div className={cn("space-y-3 rounded-2xl border p-4 transition", s.tierCard[variant])}>
      <div className="flex items-center justify-between gap-3">
        <span
          className={cn(
            "inline-flex items-center gap-2 font-display text-lg font-semibold",
            s.tierTitle[variant],
          )}
        >
          {variant === "vip" ? <Crown className="h-4 w-4" /> : null}
          {t(variant === "vip" ? "form.vip" : "form.hall")}
        </span>
        {onRemove ? (
          <button
            type="button"
            disabled={disabled}
            onClick={onRemove}
            className={cn(
              "flex h-7 w-7 items-center justify-center transition",
              s.tierRemoveBtn,
            )}
            aria-label={t("form.removeVip")}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className={cn("text-xs", s.muted)}>{t("form.pricePerHour")}</span>
          <input
            required
            disabled={disabled}
            inputMode="numeric"
            value={value.price}
            onChange={(e) => onChange({ ...value, price: e.target.value })}
            className={cn(inputClass, "font-display text-lg font-semibold")}
          />
        </label>
        <label className="block space-y-1.5">
          <span className={cn("inline-flex items-center gap-1.5 text-xs", s.muted)}>
            <Monitor className="h-3.5 w-3.5" />
            {t("form.tierPcs")}
          </span>
          <input
            disabled={disabled}
            inputMode="numeric"
            value={value.pcs}
            onChange={(e) => onChange({ ...value, pcs: e.target.value })}
            className={cn(inputClass, "font-display text-lg font-semibold")}
          />
        </label>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {TIER_SPECS.map(({ key, icon: Icon, iconClass }) => (
          <label key={key} className="block space-y-1">
            <span className={cn("inline-flex items-center gap-1.5 text-xs", s.muted)}>
              <Icon className={cn("h-3.5 w-3.5", iconClass)} />
              {t(`form.${key}`)}
            </span>
            <input
              disabled={disabled}
              value={value[key]}
              onChange={(e) => onChange({ ...value, [key]: e.target.value })}
              placeholder={t(`form.${key}Placeholder`)}
              className={inputClass}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

type CafeFormProps = {
  value: CafeFormValues;
  onChange: (next: CafeFormValues) => void;
  disabled?: boolean;
  variant?: "dark" | "light";
};

const FORM_STYLES = {
  dark: {
    input:
      "w-full rounded-xl border border-ink-700 bg-ink-950/80 px-3 py-2.5 text-ink-100 focus:border-accent disabled:opacity-60",
    label: "text-sm font-medium text-ink-100",
    muted: "text-ink-500",
    badge: "rounded-full border border-ink-700 bg-ink-900/60 text-ink-100",
    tierCard: {
      hall: TIER_STYLES.hall.card,
      vip: TIER_STYLES.vip.card,
    },
    tierTitle: {
      hall: TIER_STYLES.hall.title,
      vip: TIER_STYLES.vip.title,
    },
    tierRemoveBtn: "rounded-full text-ink-500 hover:bg-ink-800 hover:text-ink-100",
    addVipBtn:
      "rounded-2xl border border-dashed border-ink-700 text-ink-500 hover:border-status-inuse/60 hover:text-status-inuse",
    thumb: "rounded-xl border border-ink-700 bg-ink-950",
    removeBtn: "bg-ink-950/90 text-ink-100",
    dropzone:
      "rounded-xl border border-dashed border-ink-700 text-ink-500 hover:border-accent hover:text-accent",
  },
  light: {
    input:
      "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:bg-slate-50 disabled:opacity-60",
    label: "text-sm font-medium text-slate-700",
    muted: "text-slate-500",
    badge: "rounded-full border border-slate-200 bg-slate-50 text-slate-700",
    tierCard: {
      hall: "border-slate-200 bg-slate-50/60",
      vip: "border-amber-200 bg-amber-50/60",
    },
    tierTitle: {
      hall: "text-blue-700",
      vip: "text-amber-700",
    },
    tierRemoveBtn: "rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700",
    addVipBtn:
      "rounded-lg border border-dashed border-slate-300 bg-slate-50/60 text-slate-500 hover:border-amber-400 hover:text-amber-700",
    thumb: "rounded-lg border border-slate-200 bg-slate-100",
    removeBtn: "bg-white/90 text-slate-700 shadow-sm hover:bg-white",
    dropzone:
      "rounded-lg border border-dashed border-slate-300 bg-slate-50/60 text-slate-500 hover:border-slate-400 hover:text-slate-700",
  },
} as const;

type FormStyles = (typeof FORM_STYLES)[keyof typeof FORM_STYLES];

export function CafeFormFields({
  value,
  onChange,
  disabled,
  variant = "dark",
}: CafeFormProps) {
  const { t, locale } = useLocale();
  const s = FORM_STYLES[variant];

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

  const totalPcs =
    (parsePcs(value.hall.pcs) || 0) + (value.hasVip ? parsePcs(value.vip.pcs) || 0 : 0);

  const inputClass = s.input;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className={s.label}>{t("form.cafeName")}</span>
          <input
            required
            disabled={disabled}
            value={value.name}
            onChange={(e) => set("name", e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block space-y-1.5">
          <span className={s.label}>{t("form.phone")}</span>
          <input
            required
            disabled={disabled}
            value={value.phone}
            onChange={(e) => set("phone", e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <label className="block space-y-1.5">
          <span className={s.label}>{t("form.address")}</span>
          <input
            required
            disabled={disabled}
            value={value.address}
            onChange={(e) => set("address", e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block space-y-1.5">
          <span className={s.label}>{t("form.district")}</span>
          <select
            disabled={disabled}
            value={value.district}
            onChange={(e) => set("district", e.target.value as District | "")}
            className={inputClass}
          >
            <option value="">{t("form.districtPlaceholder")}</option>
            {DISTRICTS.map((d) => (
              <option key={d.id} value={d.id}>
                {d[locale]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-1.5">
        <span className={s.label}>{t("map.location")}</span>
        <LocationPicker
          value={value.location}
          disabled={disabled}
          variant={variant}
          onChange={(location, address) =>
            onChange({
              ...value,
              location,
              ...(address ? { address } : {}),
            })
          }
        />
      </div>

      <label className="block space-y-1.5">
        <span className={s.label}>{t("form.description")}</span>
        <textarea
          disabled={disabled}
          rows={2}
          value={value.description}
          onChange={(e) => set("description", e.target.value)}
          className={inputClass}
        />
      </label>

      <label className="block space-y-1.5">
        <span className={s.label}>{t("form.gear")}</span>
        <textarea
          disabled={disabled}
          rows={3}
          value={value.gear}
          onChange={(e) => set("gear", e.target.value)}
          placeholder={t("form.gearPlaceholder")}
          className={inputClass}
        />
      </label>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-0.5">
            <span className={s.label}>{t("form.pricing")}</span>
            <p className={cn("text-xs", s.muted)}>{t("form.pricingHint")}</p>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium",
              s.badge,
            )}
          >
            <Monitor className="h-3.5 w-3.5 text-accent" />
            {t("form.totalPcs", { n: totalPcs })}
          </span>
        </div>

        <div className="grid gap-4">
          <TierFields
            variant="hall"
            value={value.hall}
            onChange={(hall) => set("hall", hall)}
            disabled={disabled}
            styles={s}
          />
          {value.hasVip ? (
            <TierFields
              variant="vip"
              value={value.vip}
              onChange={(vip) => set("vip", vip)}
              onRemove={() => set("hasVip", false)}
              disabled={disabled}
              styles={s}
            />
          ) : (
            <button
              type="button"
              disabled={disabled}
              onClick={() => set("hasVip", true)}
              className={cn(
                "flex items-center justify-center gap-2 py-5 text-sm transition disabled:opacity-60",
                s.addVipBtn,
              )}
            >
              <Crown className="h-4 w-4" />
              + {t("form.hasVip")}
            </button>
          )}
        </div>
      </section>

      <div className="space-y-3">
        <span className={s.label}>{t("form.images")}</span>
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
                  className={cn("relative aspect-[4/3] overflow-hidden", s.thumb)}
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
                    className={cn(
                      "absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full",
                      s.removeBtn,
                    )}
                    aria-label={t("form.removeImage")}
                  >
                    ×
                  </button>
                </div>
              ))}
              <div
                className={cn(
                  "flex aspect-[4/3] items-center justify-center text-sm",
                  s.dropzone,
                )}
              >
                {t("form.addMore")}
              </div>
            </div>
          ) : (
            <div
              className={cn("px-4 py-10 text-center text-sm transition", s.dropzone)}
            >
              {t("form.uploadHint")}
            </div>
          )}
        </label>
      </div>
    </div>
  );
}
