import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { validateBody } from "../../middleware/validate.js";
import { requireAuth } from "../../middleware/auth.js";
import { writeRateLimit } from "../../middleware/rateLimit.js";
import { AppError } from "../../lib/errors.js";
import { createContactRequestSchema } from "./contact-requests.schema.js";
import * as contactRequestsService from "./contact-requests.service.js";

export const contactRequestsRouter = Router();

contactRequestsRouter.post(
  "/",
  requireAuth,
  writeRateLimit,
  validateBody(createContactRequestSchema),
  asyncHandler(async (req, res) => {
    if (req.userRole !== "RECRUITER") {
      throw new AppError(403, "forbidden", "Réservé aux recruteurs.");
    }
    const contactRequest = await contactRequestsService.createContactRequest(req.userId!, req.body);
    res.status(201).json({ contactRequest });
  })
);

contactRequestsRouter.get(
  "/received",
  requireAuth,
  asyncHandler(async (req, res) => {
    const contactRequests = await contactRequestsService.listReceived(req.userId!);
    res.json({ contactRequests });
  })
);

contactRequestsRouter.get(
  "/sent",
  requireAuth,
  asyncHandler(async (req, res) => {
    const contactRequests = await contactRequestsService.listSent(req.userId!);
    res.json({ contactRequests });
  })
);

contactRequestsRouter.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const detail = await contactRequestsService.getContactRequestDetail(
      req.params.id,
      req.userId!,
      req.ip
    );
    res.json({ contactRequest: detail });
  })
);

contactRequestsRouter.post(
  "/:id/accept",
  requireAuth,
  asyncHandler(async (req, res) => {
    await contactRequestsService.acceptContactRequest(req.params.id, req.userId!);
    res.status(204).send();
  })
);

contactRequestsRouter.post(
  "/:id/decline",
  requireAuth,
  asyncHandler(async (req, res) => {
    await contactRequestsService.declineContactRequest(req.params.id, req.userId!);
    res.status(204).send();
  })
);
