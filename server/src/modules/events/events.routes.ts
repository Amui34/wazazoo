import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { validateBody } from "../../middleware/validate.js";
import { requireAuth } from "../../middleware/auth.js";
import { writeRateLimit } from "../../middleware/rateLimit.js";
import { createEventSchema } from "./events.schema.js";
import * as eventsService from "./events.service.js";

export const eventsRouter = Router();

// Liste publique des événements à venir / en cours (carte + agenda).
eventsRouter.get(
  "/active",
  asyncHandler(async (_req, res) => {
    res.json({ events: await eventsService.listActive() });
  })
);

eventsRouter.get(
  "/mine",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ events: await eventsService.listMine(req.userId!) });
  })
);

eventsRouter.post(
  "/",
  requireAuth,
  writeRateLimit,
  validateBody(createEventSchema),
  asyncHandler(async (req, res) => {
    const event = await eventsService.createEvent(req.userId!, req.userRole!, req.body);
    res.status(201).json({ event });
  })
);

eventsRouter.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    await eventsService.deleteEvent(req.params.id, req.userId!);
    res.status(204).send();
  })
);
