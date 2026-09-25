import "./config/env.js";
import bcrypt from "bcryptjs";
import { connectDb } from "./db.js";
import { User } from "./models/User.js";
import { Cafe } from "./models/Cafe.js";
import { PC } from "./models/PC.js";
import { Integration } from "./models/Integration.js";
import type { PcStatus } from "@pc-booking/shared";

const STATUSES: PcStatus[] = [
  "AVAILABLE",
  "AVAILABLE",
  "AVAILABLE",
  "IN_USE",
  "IN_USE",
  "RESERVED",
  "OFFLINE",
];

function hours() {
  return Array.from({ length: 7 }, (_, day) => ({
    day,
    open: "10:00",
    close: "02:00",
    closed: false,
  }));
}

function makePcs(
  cafeId: string,
  count: number,
  pricePerHour: number,
  prefix: string,
) {
  return Array.from({ length: count }, (_, i) => {
    const n = String(i + 1).padStart(2, "0");
    const status = STATUSES[i % STATUSES.length]!;
    return {
      cafeId,
      externalId: `${prefix}-${n}`,
      name: `PC-${n}`,
      zone: i < count / 2 ? "Main Hall" : "VIP",
      status,
      pricePerHour: i >= count / 2 ? pricePerHour + 1000 : pricePerHour,
      specifications: {
        cpu: i >= count / 2 ? "Ryzen 7 5800X" : "Ryzen 5 5600X",
        gpu: i >= count / 2 ? "RTX 4070" : "RTX 3060",
        ram: i >= count / 2 ? 32 : 16,
      },
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

  const cafeDefs = [
    {
      name: "P-Gaming",
      slug: "p-gaming",
      description:
        "Downtown Ulaanbaatar gaming center with competitive setups and VIP booths.",
      address: "Seoul St 15, Sukhbaatar District, Ulaanbaatar",
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
    },
    {
      name: "Arena Cyber Cafe",
      slug: "arena-cyber-cafe",
      description: "Esports-focused cafe near Peace Avenue with streaming PCs.",
      address: "Peace Avenue 45, Chingeltei District, Ulaanbaatar",
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
    },
    {
      name: "Night Owl Capsule",
      slug: "night-owl-capsule",
      description: "Late-night capsule booths for ranked grind sessions.",
      address: "Tokyo St 8, Bayanzurkh District, Ulaanbaatar",
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
    },
  ];

  for (const def of cafeDefs) {
    const cafe = await Cafe.create({
      name: def.name,
      slug: def.slug,
      description: def.description,
      address: def.address,
      phone: def.phone,
      images: def.images,
      gear: def.gear,
      displaySpecs: def.displaySpecs,
      openingHours: hours(),
      status: "APPROVED",
      ownerId: owner!._id,
      pricePerHour: def.pricePerHour,
      totalPcs: def.pcCount,
      location: { type: "Point", coordinates: def.coordinates },
    });

    await PC.insertMany(
      makePcs(cafe._id.toString(), def.pcCount, def.pricePerHour, def.prefix),
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
    address: "Narnii Zam 3, Ulaanbaatar",
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
