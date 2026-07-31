import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "node:path";
import { authRouter } from "./modules/auth/auth.routes.js";
import { profilesRouter } from "./modules/profiles/musician/profile.routes.js";
import { uploadRouter } from "./modules/profiles/musician/upload.routes.js";
import { availabilityRouter } from "./modules/profiles/musician/availability.routes.js";
import { djRouter } from "./modules/profiles/dj/dj.routes.js";
import { referenceRouter } from "./modules/profiles/reference.routes.js";
import { searchRouter } from "./modules/search/search.routes.js";
import { venuesRouter } from "./modules/venues/venues.routes.js";
import { certificationsRouter } from "./modules/certifications/certifications.routes.js";
import { contactRequestsRouter } from "./modules/contact-requests/contact-requests.routes.js";
import { messagesRouter } from "./modules/messages/messages.routes.js";
import { eventsRouter } from "./modules/events/events.routes.js";
import { adminRouter } from "./modules/admin/admin.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { apiRateLimit } from "./middleware/rateLimit.js";

export function createApp() {
  const app = express();

  if (process.env.TRUST_PROXY) {
    app.set("trust proxy", Number(process.env.TRUST_PROXY) || 1);
  }

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CLIENT_URL ?? "http://localhost:5173",
      credentials: true,
    })
  );
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());
  app.use(
    "/uploads",
    express.static(path.join(process.cwd(), "uploads"), {
      dotfiles: "deny",
      setHeaders: (res) => {
        // Neutralise tout contenu actif même si un fichier non-image se retrouvait ici
        res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
        res.setHeader("X-Content-Type-Options", "nosniff");
      },
    })
  );

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api", apiRateLimit);
  app.use("/api/auth", authRouter);
  app.use("/api/profiles", uploadRouter);
  app.use("/api/profiles", availabilityRouter);
  app.use("/api/profiles/dj", djRouter);
  app.use("/api/profiles", profilesRouter);
  app.use("/api", referenceRouter);
  app.use("/api/search", searchRouter);
  app.use("/api/venues", venuesRouter);
  app.use("/api/certifications", certificationsRouter);
  app.use("/api/contact-requests", contactRequestsRouter);
  app.use("/api/messages", messagesRouter);
  app.use("/api/events", eventsRouter);
  app.use("/api/admin", adminRouter);

  app.use(errorHandler);

  return app;
}
