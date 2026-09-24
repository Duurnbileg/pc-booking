import { Router } from "express";
import bcrypt from "bcryptjs";
import { LoginSchema, RegisterSchema } from "@pc-booking/shared";
import { User } from "../models/User.js";
import {
  clearAuthCookie,
  requireAuth,
  setAuthCookie,
  signToken,
  toPublicUser,
} from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }

  const { name, email, phone, password, role } = parsed.data;
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  // Only allow CUSTOMER or CAFE_OWNER via public register; ADMIN via seed only
  const safeRole =
    role === "CAFE_OWNER" ? "CAFE_OWNER" : role === "ADMIN" ? "CUSTOMER" : "CUSTOMER";

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    phone,
    passwordHash,
    role: safeRole,
  });

  const token = signToken(user);
  setAuthCookie(res, token);
  res.status(201).json({ user: toPublicUser(user) });
});

authRouter.post("/login", async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }

  const { email, password } = parsed.data;
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signToken(user);
  setAuthCookie(res, token);
  res.json({ user: toPublicUser(user) });
});

authRouter.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});
