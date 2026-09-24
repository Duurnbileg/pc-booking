import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config({
  path: path.join(path.dirname(fileURLToPath(import.meta.url)), "../../.env"),
});

export const env = {
  port: Number(process.env.PORT ?? 4000),
  mongodbUri: process.env.MONGODB_URI ,
  useMemoryDb: process.env.USE_MEMORY_DB === "true",
  jwtSecret: process.env.JWT_SECRET ,
  webOrigin: process.env.WEB_ORIGIN ,
  cookieSecure: process.env.COOKIE_SECURE === "true",
  nodeEnv: process.env.NODE_ENV ?? "development",
};
