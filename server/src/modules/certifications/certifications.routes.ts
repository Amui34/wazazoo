import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { validateBody } from "../../middleware/validate.js";
import { requireAuth, optionalAuth } from "../../middleware/auth.js";
import { tokenRateLimit } from "../../middleware/rateLimit.js";
import { AppError } from "../../lib/errors.js";
import { createCertificationSchema, confirmCertificationSchema, reviewSchema } from "./certifications.schema.js";
import * as certificationsService from "./certifications.service.js";

export const certificationsRouter = Router();

certificationsRouter.post(
  "/",
  requireAuth,
  validateBody(createCertificationSchema),
  asyncHandler(async (req, res) => {
    if (req.userRole !== "MUSICIAN") {
      throw new AppError(403, "forbidden", "Réservé aux musiciens.");
    }
    const certification = await certificationsService.createCertification(req.userId!, req.body);
    res.status(201).json({ certification });
  })
);

certificationsRouter.get(
  "/mine",
  requireAuth,
  asyncHandler(async (req, res) => {
    const certifications = await certificationsService.listMyCertifications(req.userId!);
    res.json({ certifications });
  })
);

certificationsRouter.get(
  "/token/:token",
  tokenRateLimit,
  optionalAuth,
  asyncHandler(async (req, res) => {
    const certification = await certificationsService.getByToken(req.params.token);
    res.json({
      certification: {
        id: certification.id,
        status: certification.status,
        claimedVenueName: certification.claimedVenueName,
        performanceDate: certification.performanceDate,
        musicianDisplayName: certification.profile.displayName,
        musicianProfileId: certification.profile.id,
        venue: certification.venue
          ? { id: certification.venue.id, name: certification.venue.name, city: certification.venue.city }
          : null,
      },
    });
  })
);

certificationsRouter.post(
  "/token/:token/confirm",
  tokenRateLimit,
  requireAuth,
  validateBody(confirmCertificationSchema),
  asyncHandler(async (req, res) => {
    if (req.userRole !== "RECRUITER") {
      throw new AppError(403, "forbidden", "Réservé aux recruteurs / lieux.");
    }
    const certification = await certificationsService.confirmByToken(
      req.params.token,
      req.userId!,
      req.body
    );
    res.json({ certification });
  })
);

certificationsRouter.post(
  "/:id/review",
  requireAuth,
  validateBody(reviewSchema),
  asyncHandler(async (req, res) => {
    if (req.userRole !== "RECRUITER") {
      throw new AppError(403, "forbidden", "Réservé aux recruteurs / lieux.");
    }
    const review = await certificationsService.addReview(req.params.id, req.userId!, req.body);
    res.status(201).json({ review });
  })
);
