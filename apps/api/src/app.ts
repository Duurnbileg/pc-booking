import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { env } from "./config/env.js";
import { authRouter } from "./routes/auth.js";
import { cafesRouter } from "./routes/cafes.js";
import { adminRouter } from "./routes/admin.js";
import { ownerRouter } from "./routes/owner.js";
import { uploadRouter } from "./routes/upload.js";
import { bookingsRouter } from "./routes/bookings.js";
import { optionalAuth } from "./middleware/auth.js";

export function createApp(): express.Express {
  const app = express();
  app.set("trust proxy", 1);
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
  app.use("/api/admin", adminRouter);
  app.use("/api/owner", ownerRouter);
  app.use("/api/upload", uploadRouter);
  app.use("/api/bookings", bookingsRouter);

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

  return app;
}
