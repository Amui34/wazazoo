import { z } from "zod";

export const updateDjProfileSchema = z.object({
  displayName: z.string().trim().min(2, "2 caractères minimum.").max(80),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  mobilityRadiusKm: z.coerce.number().int().min(0).max(2000).optional().nullable(),
  rateMin: z.coerce.number().int().min(0).max(100000).optional().nullable(),
  rateMax: z.coerce.number().int().min(0).max(100000).optional().nullable(),
  equipmentNotes: z.string().trim().max(1000).optional().or(z.literal("")),
  styleIds: z.array(z.string().uuid()).max(15).default([]),
});

export const publishDjProfileSchema = z.object({
  acceptedPublicDisplay: z.literal(true, {
    message: "Tu dois accepter que ton profil soit visible publiquement.",
  }),
});
