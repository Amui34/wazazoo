import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { validateBody } from "../../middleware/validate.js";
import { requireAuth } from "../../middleware/auth.js";
import { writeRateLimit } from "../../middleware/rateLimit.js";
import { sendMessageSchema } from "./messages.schema.js";
import * as messagesService from "./messages.service.js";

export const messagesRouter = Router();

messagesRouter.get(
  "/conversations",
  requireAuth,
  asyncHandler(async (req, res) => {
    const conversations = await messagesService.listConversations(req.userId!);
    res.json({ conversations });
  })
);

messagesRouter.get(
  "/:contactRequestId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const thread = await messagesService.getThread(req.params.contactRequestId, req.userId!);
    res.json({ thread });
  })
);

messagesRouter.post(
  "/:contactRequestId",
  requireAuth,
  writeRateLimit,
  validateBody(sendMessageSchema),
  asyncHandler(async (req, res) => {
    const message = await messagesService.sendMessage(req.params.contactRequestId, req.userId!, req.body);
    res.status(201).json({ message });
  })
);
