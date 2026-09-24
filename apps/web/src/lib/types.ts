import type { CafeStatus, OpeningHours, PcStatus, UserRole } from "@pc-booking/shared";

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
};

export type Cafe = {
  id: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  location: { lng: number | null; lat: number | null };
  phone: string;
  images: string[];
  openingHours: OpeningHours[];
  status: CafeStatus;
  ownerId: string;
  pricePerHour: number;
  pcCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type CafePc = {
  id: string;
  cafeId: string;
  externalId: string | null;
  name: string;
  zone: string | null;
  status: PcStatus;
  specifications: {
    cpu?: string;
    gpu?: string;
    ram?: number;
  } | null;
  pricePerHour: number | null;
};
