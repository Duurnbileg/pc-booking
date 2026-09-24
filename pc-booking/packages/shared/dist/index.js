import { z } from "zod";
export const UserRoleSchema = z.enum(["CUSTOMER", "CAFE_OWNER", "ADMIN"]);
export const CafeStatusSchema = z.enum(["PENDING", "APPROVED", "SUSPENDED"]);
export const PcStatusSchema = z.enum([
    "AVAILABLE",
    "IN_USE",
    "RESERVED",
    "OFFLINE",
    "MAINTENANCE",
]);
export const OpeningHoursSchema = z.object({
    day: z.number().min(0).max(6),
    open: z.string(),
    close: z.string(),
    closed: z.boolean().optional(),
});
export const RegisterSchema = z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    phone: z.string().min(5).max(30).optional(),
    password: z.string().min(8).max(128),
    role: UserRoleSchema.optional(),
});
export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});
export const CreateCafeSchema = z.object({
    name: z.string().min(1).max(120),
    description: z.string().max(2000).optional(),
    address: z.string().min(1).max(300),
    phone: z.string().min(5).max(30),
    pricePerHour: z.number().min(0),
    images: z.array(z.string().url()).optional(),
    openingHours: z.array(OpeningHoursSchema).optional(),
    location: z
        .object({
        lng: z.number(),
        lat: z.number(),
    })
        .optional(),
    pcs: z
        .array(z.object({
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
    }))
        .optional(),
});
export const UpdateCafeSchema = CreateCafeSchema.partial().omit({ pcs: true });
export const PublicUserSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    phone: z.string().nullable().optional(),
    role: UserRoleSchema,
});
export const API_PATHS = {
    auth: {
        register: "/api/auth/register",
        login: "/api/auth/login",
        logout: "/api/auth/logout",
        me: "/api/auth/me",
    },
    cafes: {
        list: "/api/cafes",
        byId: (idOrSlug) => `/api/cafes/${idOrSlug}`,
        pcs: (cafeId) => `/api/cafes/${cafeId}/pcs`,
    },
    pcs: {
        byId: (id) => `/api/pcs/${id}`,
    },
    admin: {
        approveCafe: (id) => `/api/admin/cafes/${id}/approve`,
        pendingCafes: "/api/admin/cafes/pending",
    },
    owner: {
        myCafes: "/api/owner/cafes",
    },
};
export function slugify(input) {
    return input
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
//# sourceMappingURL=index.js.map