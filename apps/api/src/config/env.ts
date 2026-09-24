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

export const env = {
  port: Number(process.env.PORT ?? 4000),
  mongodbUri: required("MONGODB_URI"),
  useMemoryDb: process.env.USE_MEMORY_DB === "true",
  jwtSecret: required("JWT_SECRET"),
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
  cookieSecure: process.env.COOKIE_SECURE === "true",
  nodeEnv: process.env.NODE_ENV ?? "development",
};
