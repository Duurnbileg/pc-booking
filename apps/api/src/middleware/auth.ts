import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { UserRole } from "@pc-booking/shared";
import { env } from "../config/env.js";
import { User, type UserDocument } from "../models/User.js";

export const AUTH_COOKIE = "pc_booking_token";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
};

export type JwtPayload = {
  sub: string;
  role: UserRole;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signToken(user: UserDocument): string {
  const payload: JwtPayload = {
    sub: user._id.toString(),
    role: user.role as UserRole,
  };
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "7d" });
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: "lax",
    path: "/",
  });
}

export function toPublicUser(user: UserDocument): AuthUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    role: user.role as UserRole,
  };
}

export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = req.cookies?.[AUTH_COOKIE] as string | undefined;
    if (!token) {
      next();
      return;
    }
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    const user = await User.findById(payload.sub);
    if (user) {
      req.user = toPublicUser(user);
    }
    next();
  } catch {
    next();
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = req.cookies?.[AUTH_COOKIE] as string | undefined;
    if (!token) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    const user = await User.findById(payload.sub);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    req.user = toPublicUser(user);
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

export function requireRoles(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}
