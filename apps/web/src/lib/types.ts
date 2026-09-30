import type {
  CafeStatus,
  District,
  OpeningHours,
  PcStatus,
  UserRole,
} from "@pc-booking/shared";

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
  district: District | null;
  location: { lng: number | null; lat: number | null };
  phone: string;
  images: string[];
  gear: string;
  displaySpecs: string;
  openingHours: OpeningHours[];
  status: CafeStatus;
  rejectionReason?: string;
  ownerId: string;
  pricePerHour: number;
  pcCount?: number;
  availablePcs?: number | null;
  distanceKm?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminOwner = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
};

export type AdminCafe = Cafe & {
  rejectionReason: string;
  owner: AdminOwner | null;
};

export type AdminStats = {
  totalPCs: number;
  totalCustomers: number;
  pendingPCs: number;
  approvedPCs: number;
  rejectedPCs: number;
  suspendedPCs: number;
};

export type AdminCustomer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
  lastLoginAt: string | null;
};

export type Paginated<K extends string, T> = {
  [key in K]: T[];
} & {
  total: number;
  page: number;
  pageSize: number;
};

export type CafePc = {
  id: string;
  cafeId: string;
  cafeName?: string;
  externalId: string | null;
  name: string;
  zone: string | null;
  location: string;
  gear: string;
  displaySpecs: string;
  images: string[];
  hasVip: boolean;
  vipPrice: number | null;
  stagePrice: number | null;
  hallPrice: number | null;
  status: PcStatus;
  specifications: {
    cpu?: string;
    gpu?: string;
    ram?: number;
  } | null;
  pricePerHour: number | null;
};
