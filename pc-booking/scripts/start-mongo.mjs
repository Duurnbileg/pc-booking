#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cacheDir = join(root, "node_modules", ".cache", "mongodb-memory-server");
const dataDir = join(root, ".data", "db");
const port = process.env.MONGO_PORT ?? "27017";

function findMongod() {
  if (!existsSync(cacheDir)) return null;
  const files = readdirSync(cacheDir).filter((f) => f.startsWith("mongod-"));
  if (!files.length) return null;
  return join(cacheDir, files[0]);
}

const mongod = findMongod();
if (!mongod) {
  console.error(
    "No mongod binary found. Run: pnpm --filter @pc-booking/api add -D mongodb-memory-server",
  );
  process.exit(1);
}

mkdirSync(dataDir, { recursive: true });
console.log(`Starting mongod on port ${port}`);
console.log(`  binary: ${mongod}`);
console.log(`  dbpath: ${dataDir}`);

const child = spawn(
  mongod,
  ["--dbpath", dataDir, "--port", String(port), "--bind_ip", "127.0.0.1"],
  { stdio: "inherit" },
);

child.on("exit", (code) => process.exit(code ?? 0));

process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
