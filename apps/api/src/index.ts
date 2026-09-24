import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { env } from "./config/env.js";
import { connectDb } from "./db.js";
import { authRouter } from "./routes/auth.js";
import { cafesRouter } from "./routes/cafes.js";
import { pcsRouter } from "./routes/pcs.js";
import { adminRouter } from "./routes/admin.js";
import { ownerRouter } from "./routes/owner.js";
import { optionalAuth } from "./middleware/auth.js";

async function main() {
  await connectDb();
  console.log("Connected to MongoDB");

  const app = express();
  app.use(
    cors({
      origin: env.webOrigin,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use(
    morgan(env.nodeEnv === "production" ? "combined" : "dev", {
      // Browsers/IDEs probe CDP on the API port; ignore the noise.
      skip: (req) => req.path === "/json/version" || req.path.startsWith("/json/"),
    }),
  );
  app.use(optionalAuth);

  app.get("/", (_req, res) => {
    res.json({ ok: true, service: "pc-booking-api", health: "/api/health" });
  });

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "pc-booking-api" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/cafes", cafesRouter);
  app.use("/api/pcs", pcsRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/owner", ownerRouter);

  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    },
  );

  app.listen(env.port, () => {
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
