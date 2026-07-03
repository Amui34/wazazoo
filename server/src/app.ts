import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CLIENT_URL ?? "http://localhost:5173",
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Feature routers are mounted here as they're built, e.g.:
  // app.use("/api/auth", authRouter);
  // app.use("/api/profiles", profilesRouter);
  // app.use("/api/venues", venuesRouter);
  // app.use("/api/certifications", certificationsRouter);
  // app.use("/api/contact-requests", contactRequestsRouter);

  return app;
}
