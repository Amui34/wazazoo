import { Router } from "express";
import { asyncHandler } from "../../../middleware/asyncHandler.js";
import { validateBody } from "../../../middleware/validate.js";
import { requireAuth, optionalAuth } from "../../../middleware/auth.js";
import { updateProfileSchema, publishProfileSchema, addMediaSchema } from "./profile.schema.js";
import * as profileService from "./profile.service.js";

export const profilesRouter = Router();

profilesRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const profile = await profileService.getOwnProfileOrNull(req.userId!);
    res.json({ profile });
  })
);

profilesRouter.put(
  "/me",
  requireAuth,
  validateBody(updateProfileSchema),
  asyncHandler(async (req, res) => {
    const profile = await profileService.updateOwnProfile(req.userId!, req.body);
    res.json({ profile });
  })
);

profilesRouter.post(
  "/me/publish",
  requireAuth,
  validateBody(publishProfileSchema),
  asyncHandler(async (req, res) => {
    const profile = await profileService.publishOwnProfile(req.userId!, req.ip);
    res.json({ profile });
  })
);

profilesRouter.post(
  "/me/media",
  requireAuth,
  validateBody(addMediaSchema),
  asyncHandler(async (req, res) => {
    const profile = await profileService.addMedia(req.userId!, req.body);
    res.json({ profile });
  })
);

profilesRouter.delete(
  "/me/media/:mediaId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const profile = await profileService.removeMedia(req.userId!, req.params.mediaId);
    res.json({ profile });
  })
);

profilesRouter.get(
  "/:id",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const profile = await profileService.getPublicProfile(req.params.id, req.userId, req.userRole);
    res.json({ profile });
  })
);
