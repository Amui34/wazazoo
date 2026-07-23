import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { validateBody } from "../../middleware/validate.js";
import { requireAuth } from "../../middleware/auth.js";
import { writeRateLimit } from "../../middleware/rateLimit.js";
import { AppError } from "../../lib/errors.js";
import { goLiveSchema } from "./live.schema.js";
import * as liveService from "./live.service.js";

export const liveRouter = Router();

// Liste publique des artistes actuellement en live (pour la carte).
liveRouter.get(
  "/active",
  asyncHandler(async (_req, res) => {
    res.json({ spots: await liveService.listActive() });
  })
);

liveRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ spot: await liveService.getMine(req.userId!) });
  })
);

liveRouter.post(
  "/",
  requireAuth,
  writeRateLimit,
  validateBody(goLiveSchema),
  asyncHandler(async (req, res) => {
    if (req.userRole !== "MUSICIAN") {
      throw new AppError(403, "forbidden", "Réservé aux artistes.");
    }
    const spot = await liveService.goLive(req.userId!, req.body);
    res.status(201).json({ spot });
  })
);

liveRouter.delete(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    await liveService.endLive(req.userId!);
    res.status(204).send();
  })
);
