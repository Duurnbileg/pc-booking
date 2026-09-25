import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config({
  path: path.join(path.dirname(fileURLToPath(import.meta.url)), "../../.env"),
});

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function parseCloudinaryUrl(url: string | undefined): {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
} | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "cloudinary:") return null;
    const cloudName = parsed.hostname;
    const apiKey = decodeURIComponent(parsed.username);
    const apiSecret = decodeURIComponent(parsed.password);
    if (!cloudName || !apiKey || !apiSecret) return null;
    return { cloudName, apiKey, apiSecret };
  } catch {
    return null;
  }
}

const cloudinaryFromUrl = parseCloudinaryUrl(process.env.CLOUDINARY_URL);

export const env = {
  port: Number(process.env.PORT ?? 4000),
  mongodbUri: required("MONGODB_URI"),
  useMemoryDb: process.env.USE_MEMORY_DB === "true",
  jwtSecret: required("JWT_SECRET"),
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
  cookieSecure: process.env.COOKIE_SECURE === "true",
  nodeEnv: process.env.NODE_ENV ?? "development",
  cloudinary: {
    cloudName:
      process.env.CLOUDINARY_CLOUD_NAME || cloudinaryFromUrl?.cloudName || "",
    apiKey: process.env.CLOUDINARY_API_KEY || cloudinaryFromUrl?.apiKey || "",
    apiSecret:
      process.env.CLOUDINARY_API_SECRET || cloudinaryFromUrl?.apiSecret || "",
  },
};
