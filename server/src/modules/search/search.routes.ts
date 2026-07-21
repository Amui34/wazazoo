import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { searchMusicians } from "./search.service.js";

export const searchRouter = Router();

searchRouter.get(
  "/musicians",
  asyncHandler(async (req, res) => {
    const { styleId, city, budgetMax, minCertifications, kind, date } = req.query;

    const results = await searchMusicians({
      styleId: typeof styleId === "string" && styleId ? styleId : undefined,
      city: typeof city === "string" && city ? city : undefined,
      budgetMax: budgetMax ? Number(budgetMax) : undefined,
      minCertifications: minCertifications ? Number(minCertifications) : undefined,
      kind:
        kind === "MUSICIAN" || kind === "GROUP" || kind === "DJ" ? kind : undefined,
      date: typeof date === "string" && date ? date : undefined,
    });

    res.json({ results });
  })
);
