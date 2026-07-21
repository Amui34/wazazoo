import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import * as profileService from "./musician/profile.service.js";

export const referenceRouter = Router();

referenceRouter.get(
  "/styles",
  asyncHandler(async (_req, res) => {
    res.json({ styles: await profileService.listStyles() });
  })
);

referenceRouter.get(
  "/instruments",
  asyncHandler(async (_req, res) => {
    res.json({ instruments: await profileService.listInstruments() });
  })
);
