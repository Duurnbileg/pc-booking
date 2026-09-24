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
  app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
  app.use(optionalAuth);

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
  process.exit(1);
});
