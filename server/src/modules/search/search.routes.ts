import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { searchMusicians } from "./search.service.js";

export const searchRouter = Router();

searchRouter.get(
  "/musicians",
  asyncHandler(async (req, res) => {
    const { styleId, city, budgetMax, minCertifications, profileType } = req.query;

    const results = await searchMusicians({
      styleId: typeof styleId === "string" && styleId ? styleId : undefined,
      city: typeof city === "string" && city ? city : undefined,
      budgetMax: budgetMax ? Number(budgetMax) : undefined,
      minCertifications: minCertifications ? Number(minCertifications) : undefined,
      profileType: profileType === "MUSICIAN" || profileType === "DJ" ? profileType : undefined,
    });

    res.json({ results });
  })
);
