import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { requireAuth } from "../../middleware/auth.js";
import * as followsService from "./follows.service.js";

export const followsRouter = Router();

followsRouter.get(
  "/mine",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ profiles: await followsService.listMine(req.userId!) });
  })
);

followsRouter.post(
  "/:profileId",
  requireAuth,
  asyncHandler(async (req, res) => {
    await followsService.follow(req.userId!, req.params.profileId);
    res.status(204).send();
  })
);

followsRouter.delete(
  "/:profileId",
  requireAuth,
  asyncHandler(async (req, res) => {
    await followsService.unfollow(req.userId!, req.params.profileId);
    res.status(204).send();
  })
);
