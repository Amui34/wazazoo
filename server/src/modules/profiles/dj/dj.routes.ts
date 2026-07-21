import { Router } from "express";
import { asyncHandler } from "../../../middleware/asyncHandler.js";
import { validateBody } from "../../../middleware/validate.js";
import { requireAuth } from "../../../middleware/auth.js";
import { updateDjProfileSchema, publishDjProfileSchema } from "./dj.schema.js";
import * as djService from "./dj.service.js";

export const djRouter = Router();

djRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const profile = await djService.getOwnDjProfileOrNull(req.userId!);
    res.json({ profile });
  })
);

djRouter.put(
  "/me",
  requireAuth,
  validateBody(updateDjProfileSchema),
  asyncHandler(async (req, res) => {
    const profile = await djService.updateOwnDjProfile(req.userId!, req.body);
    res.json({ profile });
  })
);

djRouter.post(
  "/me/publish",
  requireAuth,
  validateBody(publishDjProfileSchema),
  asyncHandler(async (req, res) => {
    const profile = await djService.publishOwnDjProfile(req.userId!, req.ip);
    res.json({ profile });
  })
);
