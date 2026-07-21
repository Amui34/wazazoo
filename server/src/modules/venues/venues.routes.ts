import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { validateBody } from "../../middleware/validate.js";
import { requireAuth } from "../../middleware/auth.js";
import { prisma } from "../../lib/prisma.js";
import { createVenueSchema } from "./venues.schema.js";

export const venuesRouter = Router();

venuesRouter.get(
  "/mine",
  requireAuth,
  asyncHandler(async (req, res) => {
    const venues = await prisma.venue.findMany({
      where: { contactUserId: req.userId! },
      orderBy: { createdAt: "desc" },
    });
    res.json({ venues });
  })
);

venuesRouter.post(
  "/",
  requireAuth,
  validateBody(createVenueSchema),
  asyncHandler(async (req, res) => {
    const venue = await prisma.venue.create({
      data: {
        name: req.body.name,
        address: req.body.address || null,
        city: req.body.city || null,
        description: req.body.description || null,
        contactUserId: req.userId!,
      },
    });
    res.status(201).json({ venue });
  })
);
