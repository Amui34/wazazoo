import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { requireAuth } from "../../middleware/auth.js";
import * as notificationsService from "./notifications.service.js";

export const notificationsRouter = Router();

notificationsRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(await notificationsService.list(req.userId!));
  })
);

notificationsRouter.post(
  "/read",
  requireAuth,
  asyncHandler(async (req, res) => {
    await notificationsService.markAllRead(req.userId!);
    res.status(204).send();
  })
);
