import { z } from "zod";

export const createCertificationSchema = z.object({
  claimedVenueName: z.string().trim().min(2, "2 caractères minimum.").max(120),
  performanceDate: z.string().trim().optional().or(z.literal("")),
});

export const confirmCertificationSchema = z
  .object({
    venueId: z.string().uuid().optional(),
    newVenue: z
      .object({
        name: z.string().trim().min(2).max(120),
        city: z.string().trim().max(120).optional().or(z.literal("")),
      })
      .optional(),
  })
  .refine((data) => Boolean(data.venueId) !== Boolean(data.newVenue), {
    message: "Choisis un lieu existant ou renseigne un nouveau lieu, pas les deux.",
  });

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional().or(z.literal("")),
});
