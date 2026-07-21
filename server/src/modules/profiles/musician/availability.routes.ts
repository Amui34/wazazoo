import { Router } from "express";
import { asyncHandler } from "../../../middleware/asyncHandler.js";
import { validateBody } from "../../../middleware/validate.js";
import { requireAuth } from "../../../middleware/auth.js";
import { createAvailabilitySchema } from "./availability.schema.js";
import * as availabilityService from "./availability.service.js";

export const availabilityRouter = Router();

availabilityRouter.get(
  "/me/availabilities",
  requireAuth,
  asyncHandler(async (req, res) => {
    const availabilities = await availabilityService.listMyAvailabilities(req.userId!);
    res.json({ availabilities });
  })
);

availabilityRouter.post(
  "/me/availabilities",
  requireAuth,
  validateBody(createAvailabilitySchema),
  asyncHandler(async (req, res) => {
    const availability = await availabilityService.createAvailability(req.userId!, req.body);
    res.status(201).json({ availability });
  })
);

availabilityRouter.delete(
  "/me/availabilities/:availabilityId",
  requireAuth,
  asyncHandler(async (req, res) => {
    await availabilityService.removeAvailability(req.userId!, req.params.availabilityId);
    res.status(204).send();
  })
);
