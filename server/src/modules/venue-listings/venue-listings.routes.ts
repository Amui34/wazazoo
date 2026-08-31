import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { requireAuth } from "../../middleware/auth.js";
import * as service from "./venue-listings.service.js";

export const venueListingsRouter = Router();

// GET /api/venue-listings?bbox=south,west,north,east&category=bar&limit=300
// Renvoie les vrais lieux (OSM) visibles dans la zone de la carte.
venueListingsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const raw = typeof req.query.bbox === "string" ? req.query.bbox : "";
    const parts = raw.split(",").map(Number);
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) {
      return res.json({ listings: [] });
    }
    const [south, west, north, east] = parts;
    const category = typeof req.query.category === "string" ? req.query.category : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const listings = await service.listInBbox({ south, west, north, east }, { category, limit });
    res.json({ listings });
  })
);

// Le listing revendiqué par le compte courant (pour l'éditeur).
venueListingsRouter.get(
  "/mine",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ listing: await service.myClaim(req.userId!) });
  })
);

// Revendiquer / libérer un lieu (compte VENUE).
venueListingsRouter.post(
  "/:id/claim",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(await service.claim(req.userId!, req.params.id));
  })
);

venueListingsRouter.delete(
  "/:id/claim",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(await service.unclaim(req.userId!, req.params.id));
  })
);
