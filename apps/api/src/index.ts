import { env } from "./config/env.js";
import { connectDb } from "./db.js";
import { createApp } from "./app.js";

async function main() {
  await connectDb();
  console.log("Connected to MongoDB");

  createApp().listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  console.error("Failed to start API", err);
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes("IP that isn't whitelisted")) {
    console.error(
      "\nMongoDB Atlas blocked this machine's IP. In Atlas → Network Access, add your current IP (or 0.0.0.0/0 for local dev), then restart the API.\n",
    );
  }
  process.exit(1);
});
