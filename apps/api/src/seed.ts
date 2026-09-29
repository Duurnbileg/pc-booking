import "./config/env.js";
import bcrypt from "bcryptjs";
import { connectDb } from "./db.js";
import { User } from "./models/User.js";
import { Cafe } from "./models/Cafe.js";
import { PC } from "./models/PC.js";
import { Integration } from "./models/Integration.js";
import type { District, PcStatus } from "@pc-booking/shared";

const STATUSES: PcStatus[] = [
  "AVAILABLE",
  "AVAILABLE",
  "AVAILABLE",
  "IN_USE",
  "IN_USE",
  "RESERVED",
  "OFFLINE",
];

function hours(closedDays: number[] = []) {
  return Array.from({ length: 7 }, (_, day) => ({
    day,
    open: "10:00",
    close: "02:00",
    closed: closedDays.includes(day),
  }));
}

type PcTier = { cpu: string; gpu: string; ram: number };

function makePcs(
  cafeId: string,
  count: number,
  pricePerHour: number,
  prefix: string,
  tiers: { main: PcTier; vip: PcTier },
) {
  return Array.from({ length: count }, (_, i) => {
    const n = String(i + 1).padStart(2, "0");
    const status = STATUSES[i % STATUSES.length]!;
    const vip = i >= count / 2;
    return {
      cafeId,
      externalId: `${prefix}-${n}`,
      name: `PC-${n}`,
      zone: vip ? "VIP" : "Main Hall",
      status,
      pricePerHour: vip ? pricePerHour + 1000 : pricePerHour,
      specifications: vip ? tiers.vip : tiers.main,
    };
  });
}

async function seed() {
  await connectDb();
  console.log("Seeding database...");

  await Promise.all([
    User.deleteMany({}),
    Cafe.deleteMany({}),
    PC.deleteMany({}),
    Integration.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash("password123", 10);

  const [admin, owner, customer] = await User.create([
    {
      name: "Platform Admin",
      email: "admin@pcbooking.mn",
      phone: "+97699110001",
      passwordHash,
      role: "ADMIN",
    },
    {
      name: "Batbayar Owner",
      email: "owner@pcbooking.mn",
      phone: "+97699110002",
      passwordHash,
      role: "CAFE_OWNER",
    },
    {
      name: "Duuree Customer",
      email: "customer@pcbooking.mn",
      phone: "+97699110003",
      passwordHash,
      role: "CUSTOMER",
    },
  ]);

  const cafeDefs: {
    name: string;
    slug: string;
    description: string;
    address: string;
    district: District;
    phone: string;
    pricePerHour: number;
    gear: string;
    displaySpecs: string;
    coordinates: [number, number];
    pcCount: number;
    prefix: string;
    images: string[];
    tiers: { main: PcTier; vip: PcTier };
    closedDays?: number[];
  }[] = [
    {
      name: "P-Gaming",
      slug: "p-gaming",
      description:
        "Downtown Ulaanbaatar gaming center with competitive setups and VIP booths.",
      address: "Seoul St 15, Sukhbaatar District, Ulaanbaatar",
      district: "SUKHBAATAR",
      phone: "+97670111111",
      pricePerHour: 3000,
      gear: "Racing chairs, HyperX headsets, Logitech mice",
      displaySpecs: "Ryzen 5/7 · RTX 3060/4070 · 16–32GB · 144–240Hz",
      coordinates: [106.9177, 47.9184] as [number, number],
      pcCount: 24,
      prefix: "pg",
      images: [
        "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80",
        "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&q=80",
      ],
      tiers: {
        main: { cpu: "Ryzen 5 5600X", gpu: "RTX 3060", ram: 16 },
        vip: { cpu: "Ryzen 7 5800X", gpu: "RTX 4070", ram: 32 },
      },
    },
    {
      name: "Arena Cyber Cafe",
      slug: "arena-cyber-cafe",
      description: "Esports-focused cafe near Peace Avenue with streaming PCs.",
      address: "Peace Avenue 45, Chingeltei District, Ulaanbaatar",
      district: "CHINGELTEI",
      phone: "+97670112222",
      pricePerHour: 3500,
      gear: "Streaming mics, dual monitors, mechanical keyboards",
      displaySpecs: "i5/i7 · RTX 3070 · 32GB · 27\" 165Hz",
      coordinates: [106.9055, 47.9212] as [number, number],
      pcCount: 32,
      prefix: "arena",
      images: [
        "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=1200&q=80",
        "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=1200&q=80",
      ],
      tiers: {
        main: { cpu: "Intel i5-12400F", gpu: "RTX 3070", ram: 32 },
        vip: { cpu: "Intel i7-12700F", gpu: "RTX 3070", ram: 32 },
      },
    },
    {
      name: "Night Owl Capsule",
      slug: "night-owl-capsule",
      description: "Late-night capsule booths for ranked grind sessions.",
      address: "Tokyo St 8, Bayanzurkh District, Ulaanbaatar",
      district: "BAYANZURKH",
      phone: "+97670113333",
      pricePerHour: 2800,
      gear: "Private booths, blankets, quiet headsets",
      displaySpecs: "Ryzen 5 · RTX 3060 · 16GB · 144Hz",
      coordinates: [106.945, 47.911] as [number, number],
      pcCount: 16,
      prefix: "owl",
      images: [
        "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=1200&q=80",
      ],
      tiers: {
        main: { cpu: "Ryzen 5 5600", gpu: "RTX 3060", ram: 16 },
        vip: { cpu: "Ryzen 5 5600", gpu: "RTX 3060", ram: 16 },
      },
    },
    {
      name: "Zaisan Pro Arena",
      slug: "zaisan-pro-arena",
      description: "Premium esports arena with top-tier rigs and 240Hz panels.",
      address: "Zaisan St 21, Khan-Uul District, Ulaanbaatar",
      district: "KHAN_UUL",
      phone: "+97670115555",
      pricePerHour: 4500,
      gear: "Secretlab chairs, Razer peripherals, stage for tournaments",
      displaySpecs: "i9 · RTX 4080 · 32GB · 240Hz",
      coordinates: [106.9205, 47.8872] as [number, number],
      pcCount: 40,
      prefix: "zaisan",
      images: [
        "https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=1200&q=80",
      ],
      tiers: {
        main: { cpu: "Intel i9-13900K", gpu: "RTX 4080", ram: 32 },
        vip: { cpu: "Intel i9-13900K", gpu: "RTX 4080", ram: 32 },
      },
    },
    {
      name: "West Side LAN",
      slug: "west-side-lan",
      description: "Budget-friendly neighbourhood cafe for casual sessions.",
      address: "Enkhtaivan Ave 102, Bayangol District, Ulaanbaatar",
      district: "BAYANGOL",
      phone: "+97670116666",
      pricePerHour: 2500,
      gear: "Standard chairs, wired headsets",
      displaySpecs: "i5 · GTX 1660 · 16GB · 144Hz",
      coordinates: [106.8812, 47.9145] as [number, number],
      pcCount: 20,
      prefix: "west",
      images: [
        "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=1200&q=80",
      ],
      tiers: {
        main: { cpu: "Intel i5-10400F", gpu: "GTX 1660", ram: 16 },
        vip: { cpu: "Intel i5-10400F", gpu: "GTX 1660", ram: 16 },
      },
      // Closed on Mondays
      closedDays: [1],
    },
  ];

  for (const def of cafeDefs) {
    const cafe = await Cafe.create({
      name: def.name,
      slug: def.slug,
      description: def.description,
      address: def.address,
      district: def.district,
      phone: def.phone,
      images: def.images,
      gear: def.gear,
      displaySpecs: def.displaySpecs,
      openingHours: hours(def.closedDays),
      status: "APPROVED",
      ownerId: owner!._id,
      pricePerHour: def.pricePerHour,
      totalPcs: def.pcCount,
      location: { type: "Point", coordinates: def.coordinates },
    });

    await PC.insertMany(
      makePcs(cafe._id.toString(), def.pcCount, def.pricePerHour, def.prefix, def.tiers),
    );

    await Integration.create({
      cafeId: cafe._id,
      provider: "MOCK",
      status: "DISCONNECTED",
    });
  }

  // One pending cafe for admin approve flow
  await Cafe.create({
    name: "Pixel Nest (Pending)",
    slug: "pixel-nest-pending",
    description: "New cafe awaiting platform approval.",
    address: "Narnii Zam 3, Khan-Uul District, Ulaanbaatar",
    district: "KHAN_UUL",
    phone: "+97670114444",
    images: [
      "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=1200&q=80",
    ],
    gear: "Starter chairs and headsets",
    displaySpecs: "Ryzen 5 · GTX 1660 · 16GB",
    openingHours: hours(),
    status: "PENDING",
    ownerId: owner!._id,
    pricePerHour: 3200,
    totalPcs: 12,
    location: { type: "Point", coordinates: [106.91, 47.92] },
  });

  console.log("Seed complete.");
  console.log("Accounts (password: password123):");
  console.log(`  ADMIN     ${admin!.email}`);
  console.log(`  OWNER     ${owner!.email}`);
  console.log(`  CUSTOMER  ${customer!.email}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
