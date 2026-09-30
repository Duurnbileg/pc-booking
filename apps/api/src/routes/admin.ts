import { Router, type Request, type Response } from "express";
import mongoose from "mongoose";
import { CafeStatusSchema } from "@pc-booking/shared";
import { Cafe, type CafeDocument } from "../models/Cafe.js";
import { Integration } from "../models/Integration.js";
import { PC } from "../models/PC.js";
import { User, type UserDocument } from "../models/User.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import {
  serializeCafe,
  serializeCustomer,
  serializeOwner,
} from "../utils/serialize.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRoles("ADMIN"));

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function queryString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function pagination(req: Request) {
  const page = Math.max(1, Math.floor(Number(req.query.page)) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Math.floor(Number(req.query.limit)) || DEFAULT_PAGE_SIZE),
  );
  return { page, pageSize, skip: (page - 1) * pageSize };
}

async function findCafeOr404(req: Request, res: Response) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ error: "Invalid cafe id" });
    return null;
  }
  const cafe = await Cafe.findById(req.params.id);
  if (!cafe) {
    res.status(404).json({ error: "Cafe not found" });
    return null;
  }
  return cafe;
}

async function withOwners(cafes: CafeDocument[]) {
  const ownerIds = [...new Set(cafes.map((c) => c.ownerId.toString()))];
  const owners = await User.find({ _id: { $in: ownerIds } });
  const byId = new Map(owners.map((u) => [u._id.toString(), u]));
  return cafes.map((c) => ({
    ...serializeCafe(c),
    owner: serializeOwner(byId.get(c.ownerId.toString())),
  }));
}

adminRouter.get("/stats", async (_req, res) => {
  const [statusRows, totalCustomers] = await Promise.all([
    Cafe.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    User.countDocuments({ role: "CUSTOMER" }),
  ]);
  const byStatus = new Map(statusRows.map((r) => [r._id, r.count]));
  res.json({
    totalPCs: statusRows.reduce((sum, r) => sum + r.count, 0),
    totalCustomers,
    pendingPCs: byStatus.get("PENDING") ?? 0,
    approvedPCs: byStatus.get("APPROVED") ?? 0,
    rejectedPCs: byStatus.get("REJECTED") ?? 0,
    suspendedPCs: byStatus.get("SUSPENDED") ?? 0,
  });
});

adminRouter.get("/cafes/pending", async (_req, res) => {
  const cafes = await Cafe.find({ status: "PENDING" }).sort({ createdAt: -1 });
  res.json({
    cafes: cafes.map((c) => serializeCafe(c)),
  });
});

adminRouter.get("/cafes", async (req, res) => {
  const { page, pageSize, skip } = pagination(req);
  const filter: Record<string, unknown> = {};

  const status = CafeStatusSchema.safeParse(queryString(req.query.status).toUpperCase());
  if (status.success) filter.status = status.data;

  const search = queryString(req.query.search);
  if (search) {
    const pattern = { $regex: escapeRegex(search), $options: "i" };
    const owners = await User.find({ $or: [{ name: pattern }, { email: pattern }] })
      .select("_id")
      .limit(500);
    filter.$or = [
      { name: pattern },
      { address: pattern },
      { district: pattern },
      { ownerId: { $in: owners.map((o) => o._id) } },
    ];
  }

  const [cafes, total] = await Promise.all([
    Cafe.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize),
    Cafe.countDocuments(filter),
  ]);

  res.json({ cafes: await withOwners(cafes), total, page, pageSize });
});

adminRouter.get("/cafes/:id", async (req, res) => {
  const cafe = await findCafeOr404(req, res);
  if (!cafe) return;
  const [serialized] = await withOwners([cafe]);
  res.json({ cafe: serialized });
});

adminRouter.post("/cafes/:id/approve", async (req, res) => {
  const cafe = await findCafeOr404(req, res);
  if (!cafe) return;
  if (cafe.status === "APPROVED") {
    res.status(400).json({ error: "Cafe is already approved" });
    return;
  }

  cafe.status = "APPROVED";
  cafe.rejectionReason = "";
  await cafe.save();
  res.json({ cafe: serializeCafe(cafe) });
});

adminRouter.post("/cafes/:id/reject", async (req, res) => {
  const cafe = await findCafeOr404(req, res);
  if (!cafe) return;
  if (cafe.status !== "PENDING") {
    res.status(400).json({ error: "Only pending cafes can be rejected" });
    return;
  }

  const body = (req.body ?? {}) as { reason?: unknown };
  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : "";
  cafe.status = "REJECTED";
  cafe.rejectionReason = reason;
  await cafe.save();
  res.json({ cafe: serializeCafe(cafe) });
});

adminRouter.delete("/cafes/:id", async (req, res) => {
  const cafe = await findCafeOr404(req, res);
  if (!cafe) return;

  await PC.deleteMany({ cafeId: cafe._id });
  await Integration.deleteMany({ cafeId: cafe._id });
  await cafe.deleteOne();
  res.json({ ok: true });
});

adminRouter.post("/cafes/:id/suspend", async (req, res) => {
  const cafe = await findCafeOr404(req, res);
  if (!cafe) return;

  cafe.status = "SUSPENDED";
  await cafe.save();
  res.json({ cafe: serializeCafe(cafe) });
});

adminRouter.get("/customers", async (req, res) => {
  const { page, pageSize, skip } = pagination(req);
  const filter: Record<string, unknown> = { role: "CUSTOMER" };

  const digits = queryString(req.query.phone).replace(/\D/g, "");
  if (digits) {
    // Match digits even when the stored phone has spaces, dashes, or a +976 prefix.
    filter.phone = { $regex: digits.split("").map(escapeRegex).join("\\D*") };
  }

  const [customers, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize),
    User.countDocuments(filter),
  ]);

  res.json({
    customers: customers.map((u: UserDocument) => serializeCustomer(u)),
    total,
    page,
    pageSize,
  });
});

adminRouter.get("/customers/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ error: "Invalid customer id" });
    return;
  }
  const user = await User.findOne({ _id: req.params.id, role: "CUSTOMER" });
  if (!user) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }
  res.json({ customer: serializeCustomer(user) });
});
