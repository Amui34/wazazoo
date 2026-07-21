import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { requireAuth, requireAdmin } from "../../middleware/auth.js";
import { AppError } from "../../lib/errors.js";
import * as adminService from "./admin.service.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.get(
  "/profiles",
  asyncHandler(async (_req, res) => {
    res.json({ profiles: await adminService.listProfiles() });
  })
);

adminRouter.post(
  "/profiles/:id/suspend",
  asyncHandler(async (req, res) => {
    const profile = await adminService.setProfileStatus(req.params.id, "SUSPENDED");
    res.json({ profile });
  })
);

adminRouter.post(
  "/profiles/:id/reactivate",
  asyncHandler(async (req, res) => {
    const profile = await adminService.setProfileStatus(req.params.id, "PUBLISHED");
    res.json({ profile });
  })
);

adminRouter.get(
  "/users",
  asyncHandler(async (_req, res) => {
    res.json({ users: await adminService.listUsers() });
  })
);

adminRouter.get(
  "/certifications",
  asyncHandler(async (_req, res) => {
    res.json({ certifications: await adminService.listCertifications() });
  })
);
