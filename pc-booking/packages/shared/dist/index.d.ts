import { z } from "zod";
export declare const UserRoleSchema: z.ZodEnum<["CUSTOMER", "CAFE_OWNER", "ADMIN"]>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export declare const CafeStatusSchema: z.ZodEnum<["PENDING", "APPROVED", "SUSPENDED"]>;
export type CafeStatus = z.infer<typeof CafeStatusSchema>;
export declare const PcStatusSchema: z.ZodEnum<["AVAILABLE", "IN_USE", "RESERVED", "OFFLINE", "MAINTENANCE"]>;
export type PcStatus = z.infer<typeof PcStatusSchema>;
export declare const OpeningHoursSchema: z.ZodObject<{
    day: z.ZodNumber;
    open: z.ZodString;
    close: z.ZodString;
    closed: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    day: number;
    open: string;
    close: string;
    closed?: boolean | undefined;
}, {
    day: number;
    open: string;
    close: string;
    closed?: boolean | undefined;
}>;
export type OpeningHours = z.infer<typeof OpeningHoursSchema>;
export declare const RegisterSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    password: z.ZodString;
    role: z.ZodOptional<z.ZodEnum<["CUSTOMER", "CAFE_OWNER", "ADMIN"]>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    password: string;
    phone?: string | undefined;
    role?: "CUSTOMER" | "CAFE_OWNER" | "ADMIN" | undefined;
}, {
    name: string;
    email: string;
    password: string;
    phone?: string | undefined;
    role?: "CUSTOMER" | "CAFE_OWNER" | "ADMIN" | undefined;
}>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export type LoginInput = z.infer<typeof LoginSchema>;
export declare const CreateCafeSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    address: z.ZodString;
    phone: z.ZodString;
    pricePerHour: z.ZodNumber;
    images: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    openingHours: z.ZodOptional<z.ZodArray<z.ZodObject<{
        day: z.ZodNumber;
        open: z.ZodString;
        close: z.ZodString;
        closed: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        day: number;
        open: string;
        close: string;
        closed?: boolean | undefined;
    }, {
        day: number;
        open: string;
        close: string;
        closed?: boolean | undefined;
    }>, "many">>;
    location: z.ZodOptional<z.ZodObject<{
        lng: z.ZodNumber;
        lat: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        lng: number;
        lat: number;
    }, {
        lng: number;
        lat: number;
    }>>;
    pcs: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        zone: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["AVAILABLE", "IN_USE", "RESERVED", "OFFLINE", "MAINTENANCE"]>>;
        pricePerHour: z.ZodOptional<z.ZodNumber>;
        specifications: z.ZodOptional<z.ZodObject<{
            cpu: z.ZodOptional<z.ZodString>;
            gpu: z.ZodOptional<z.ZodString>;
            ram: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            cpu?: string | undefined;
            gpu?: string | undefined;
            ram?: number | undefined;
        }, {
            cpu?: string | undefined;
            gpu?: string | undefined;
            ram?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        status?: "AVAILABLE" | "IN_USE" | "RESERVED" | "OFFLINE" | "MAINTENANCE" | undefined;
        pricePerHour?: number | undefined;
        zone?: string | undefined;
        specifications?: {
            cpu?: string | undefined;
            gpu?: string | undefined;
            ram?: number | undefined;
        } | undefined;
    }, {
        name: string;
        status?: "AVAILABLE" | "IN_USE" | "RESERVED" | "OFFLINE" | "MAINTENANCE" | undefined;
        pricePerHour?: number | undefined;
        zone?: string | undefined;
        specifications?: {
            cpu?: string | undefined;
            gpu?: string | undefined;
            ram?: number | undefined;
        } | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    phone: string;
    address: string;
    pricePerHour: number;
    description?: string | undefined;
    images?: string[] | undefined;
    openingHours?: {
        day: number;
        open: string;
        close: string;
        closed?: boolean | undefined;
    }[] | undefined;
    location?: {
        lng: number;
        lat: number;
    } | undefined;
    pcs?: {
        name: string;
        status?: "AVAILABLE" | "IN_USE" | "RESERVED" | "OFFLINE" | "MAINTENANCE" | undefined;
        pricePerHour?: number | undefined;
        zone?: string | undefined;
        specifications?: {
            cpu?: string | undefined;
            gpu?: string | undefined;
            ram?: number | undefined;
        } | undefined;
    }[] | undefined;
}, {
    name: string;
    phone: string;
    address: string;
    pricePerHour: number;
    description?: string | undefined;
    images?: string[] | undefined;
    openingHours?: {
        day: number;
        open: string;
        close: string;
        closed?: boolean | undefined;
    }[] | undefined;
    location?: {
        lng: number;
        lat: number;
    } | undefined;
    pcs?: {
        name: string;
        status?: "AVAILABLE" | "IN_USE" | "RESERVED" | "OFFLINE" | "MAINTENANCE" | undefined;
        pricePerHour?: number | undefined;
        zone?: string | undefined;
        specifications?: {
            cpu?: string | undefined;
            gpu?: string | undefined;
            ram?: number | undefined;
        } | undefined;
    }[] | undefined;
}>;
export type CreateCafeInput = z.infer<typeof CreateCafeSchema>;
export declare const UpdateCafeSchema: z.ZodObject<Omit<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    address: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    pricePerHour: z.ZodOptional<z.ZodNumber>;
    images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    openingHours: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        day: z.ZodNumber;
        open: z.ZodString;
        close: z.ZodString;
        closed: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        day: number;
        open: string;
        close: string;
        closed?: boolean | undefined;
    }, {
        day: number;
        open: string;
        close: string;
        closed?: boolean | undefined;
    }>, "many">>>;
    location: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        lng: z.ZodNumber;
        lat: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        lng: number;
        lat: number;
    }, {
        lng: number;
        lat: number;
    }>>>;
    pcs: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        zone: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["AVAILABLE", "IN_USE", "RESERVED", "OFFLINE", "MAINTENANCE"]>>;
        pricePerHour: z.ZodOptional<z.ZodNumber>;
        specifications: z.ZodOptional<z.ZodObject<{
            cpu: z.ZodOptional<z.ZodString>;
            gpu: z.ZodOptional<z.ZodString>;
            ram: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            cpu?: string | undefined;
            gpu?: string | undefined;
            ram?: number | undefined;
        }, {
            cpu?: string | undefined;
            gpu?: string | undefined;
            ram?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        status?: "AVAILABLE" | "IN_USE" | "RESERVED" | "OFFLINE" | "MAINTENANCE" | undefined;
        pricePerHour?: number | undefined;
        zone?: string | undefined;
        specifications?: {
            cpu?: string | undefined;
            gpu?: string | undefined;
            ram?: number | undefined;
        } | undefined;
    }, {
        name: string;
        status?: "AVAILABLE" | "IN_USE" | "RESERVED" | "OFFLINE" | "MAINTENANCE" | undefined;
        pricePerHour?: number | undefined;
        zone?: string | undefined;
        specifications?: {
            cpu?: string | undefined;
            gpu?: string | undefined;
            ram?: number | undefined;
        } | undefined;
    }>, "many">>>;
}, "pcs">, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    phone?: string | undefined;
    description?: string | undefined;
    address?: string | undefined;
    pricePerHour?: number | undefined;
    images?: string[] | undefined;
    openingHours?: {
        day: number;
        open: string;
        close: string;
        closed?: boolean | undefined;
    }[] | undefined;
    location?: {
        lng: number;
        lat: number;
    } | undefined;
}, {
    name?: string | undefined;
    phone?: string | undefined;
    description?: string | undefined;
    address?: string | undefined;
    pricePerHour?: number | undefined;
    images?: string[] | undefined;
    openingHours?: {
        day: number;
        open: string;
        close: string;
        closed?: boolean | undefined;
    }[] | undefined;
    location?: {
        lng: number;
        lat: number;
    } | undefined;
}>;
export type UpdateCafeInput = z.infer<typeof UpdateCafeSchema>;
export declare const PublicUserSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    role: z.ZodEnum<["CUSTOMER", "CAFE_OWNER", "ADMIN"]>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    role: "CUSTOMER" | "CAFE_OWNER" | "ADMIN";
    id: string;
    phone?: string | null | undefined;
}, {
    name: string;
    email: string;
    role: "CUSTOMER" | "CAFE_OWNER" | "ADMIN";
    id: string;
    phone?: string | null | undefined;
}>;
export type PublicUser = z.infer<typeof PublicUserSchema>;
export declare const API_PATHS: {
    readonly auth: {
        readonly register: "/api/auth/register";
        readonly login: "/api/auth/login";
        readonly logout: "/api/auth/logout";
        readonly me: "/api/auth/me";
    };
    readonly cafes: {
        readonly list: "/api/cafes";
        readonly byId: (idOrSlug: string) => string;
        readonly pcs: (cafeId: string) => string;
    };
    readonly pcs: {
        readonly byId: (id: string) => string;
    };
    readonly admin: {
        readonly approveCafe: (id: string) => string;
        readonly pendingCafes: "/api/admin/cafes/pending";
    };
    readonly owner: {
        readonly myCafes: "/api/owner/cafes";
    };
};
export declare function slugify(input: string): string;
