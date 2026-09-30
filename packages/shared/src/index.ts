import { z } from "zod";

export const UserRoleSchema = z.enum(["CUSTOMER", "CAFE_OWNER", "ADMIN"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const CafeStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED", "SUSPENDED"]);
export type CafeStatus = z.infer<typeof CafeStatusSchema>;

export const PcStatusSchema = z.enum([
  "AVAILABLE",
  "IN_USE",
  "RESERVED",
  "OFFLINE",
  "MAINTENANCE",
]);
export type PcStatus = z.infer<typeof PcStatusSchema>;

export const OpeningHoursSchema = z.object({
  day: z.number().min(0).max(6),
  open: z.string(),
  close: z.string(),
  closed: z.boolean().optional(),
});
export type OpeningHours = z.infer<typeof OpeningHoursSchema>;

export const DISTRICTS = [
  { id: "BAYANGOL", mn: "Баянгол", en: "Bayangol" },
  { id: "BAYANZURKH", mn: "Баянзүрх", en: "Bayanzurkh" },
  { id: "CHINGELTEI", mn: "Чингэлтэй", en: "Chingeltei" },
  { id: "KHAN_UUL", mn: "Хан-Уул", en: "Khan-Uul" },
  { id: "SONGINOKHAIRKHAN", mn: "Сонгинохайрхан", en: "Songinokhairkhan" },
  { id: "SUKHBAATAR", mn: "Сүхбаатар", en: "Sukhbaatar" },
  { id: "NALAIKH", mn: "Налайх", en: "Nalaikh" },
  { id: "BAGANUUR", mn: "Багануур", en: "Baganuur" },
  { id: "BAGAKHANGAI", mn: "Багахангай", en: "Bagakhangai" },
] as const;

export const DISTRICT_IDS = DISTRICTS.map((d) => d.id) as [
  (typeof DISTRICTS)[number]["id"],
  ...(typeof DISTRICTS)[number]["id"][],
];
export const DistrictSchema = z.enum(DISTRICT_IDS);
export type District = z.infer<typeof DistrictSchema>;

export const GPU_OPTIONS = [
  "RTX 4090",
  "RTX 4080",
  "RTX 4070",
  "RTX 3070",
  "RTX 3060",
  "GTX 1660",
] as const;

export const MONITOR_HZ_OPTIONS = ["240Hz", "165Hz", "144Hz"] as const;

export const CAFE_SORTS = ["newest", "price_asc", "price_desc"] as const;
export type CafeSort = (typeof CAFE_SORTS)[number];

export const PRICE_RANGES = [
  { id: "UNDER_3000", max: 3000 },
  { id: "3000_4000", min: 3001, max: 4000 },
  { id: "OVER_4000", min: 4001 },
] as const satisfies readonly { id: string; min?: number; max?: number }[];
export type PriceRangeId = (typeof PRICE_RANGES)[number]["id"];

export const RegisterSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().min(5).max(30).optional(),
  password: z.string().min(8).max(128),
  role: UserRoleSchema.optional(),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const PricingTierSchema = z.object({
  price: z.number().min(0),
  pcs: z.number().int().min(0).default(0),
  gpu: z.string().max(100).default(""),
  cpu: z.string().max(100).default(""),
  ram: z.string().max(100).default(""),
  monitor: z.string().max(100).default(""),
});
export type PricingTier = z.infer<typeof PricingTierSchema>;

export const CafePricingSchema = z.object({
  hall: PricingTierSchema,
  vip: PricingTierSchema.nullable().optional(),
});
export type CafePricing = z.infer<typeof CafePricingSchema>;

/** Joins tier specs into one searchable line, e.g. "RTX 5070Ti · Ryzen 7 9800X3D · 32GB DDR5 · ZOWIE 600Hz". */
export function pricingSummary(pricing: CafePricing): string {
  const tiers = [pricing.hall, pricing.vip].filter(
    (tier): tier is PricingTier => Boolean(tier),
  );
  const lines = tiers.map((tier) =>
    [tier.gpu, tier.cpu, tier.ram, tier.monitor]
      .map((s) => s.trim())
      .filter(Boolean)
      .join(" · "),
  );
  return [...new Set(lines.filter(Boolean))].join(" / ");
}

export const CreateCafeSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  address: z.string().min(1).max(300),
  district: DistrictSchema.optional(),
  phone: z.string().min(5).max(30),
  pricePerHour: z.number().min(0).optional(),
  pricing: CafePricingSchema.optional(),
  gear: z.string().max(2000).optional(),
  displaySpecs: z.string().max(2000).optional(),
  pcCount: z.number().int().min(0).optional(),
  images: z.array(z.string().url()).max(12).optional(),
  openingHours: z.array(OpeningHoursSchema).optional(),
  location: z
    .object({
      lng: z.number(),
      lat: z.number(),
    })
    .optional(),
  pcs: z
    .array(
      z.object({
        name: z.string().min(1),
        zone: z.string().optional(),
        status: PcStatusSchema.optional(),
        pricePerHour: z.number().min(0).optional(),
        specifications: z
          .object({
            cpu: z.string().optional(),
            gpu: z.string().optional(),
            ram: z.number().optional(),
          })
          .optional(),
      }),
    )
    .optional(),
});
export type CreateCafeInput = z.infer<typeof CreateCafeSchema>;

export const UpdateCafeSchema = CreateCafeSchema.partial().omit({ pcs: true });
export type UpdateCafeInput = z.infer<typeof UpdateCafeSchema>;

export const PublicUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
  role: UserRoleSchema,
});
export type PublicUser = z.infer<typeof PublicUserSchema>;

export const API_PATHS = {
  auth: {
    register: "/api/auth/register",
    login: "/api/auth/login",
    logout: "/api/auth/logout",
    me: "/api/auth/me",
  },
  cafes: {
    list: "/api/cafes",
    byId: (idOrSlug: string) => `/api/cafes/${idOrSlug}`,
    pcs: (idOrSlug: string) => `/api/cafes/${idOrSlug}/pcs`,
  },
  admin: {
    approveCafe: (id: string) => `/api/admin/cafes/${id}/approve`,
    rejectCafe: (id: string) => `/api/admin/cafes/${id}/reject`,
    suspendCafe: (id: string) => `/api/admin/cafes/${id}/suspend`,
    deleteCafe: (id: string) => `/api/admin/cafes/${id}`,
    cafeById: (id: string) => `/api/admin/cafes/${id}`,
    pendingCafes: "/api/admin/cafes/pending",
    cafes: "/api/admin/cafes",
    stats: "/api/admin/stats",
    customers: "/api/admin/customers",
    customerById: (id: string) => `/api/admin/customers/${id}`,
  },
  upload: "/api/upload",
  owner: {
    myCafes: "/api/owner/cafes",
  },
} as const;

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function defaultOpeningHours(): OpeningHours[] {
  return Array.from({ length: 7 }, (_, day) => ({
    day,
    open: "10:00",
    close: "02:00",
    closed: false,
  }));
}
