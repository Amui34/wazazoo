import { z } from "zod";

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(2, "2 caractères minimum.").max(80),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  openingHours: z.string().trim().max(300).optional().or(z.literal("")),
  mobilityRadiusKm: z.coerce.number().int().min(0).max(2000).optional().nullable(),
  rateMin: z.coerce.number().int().min(0).max(100000).optional().nullable(),
  rateMax: z.coerce.number().int().min(0).max(100000).optional().nullable(),
  styleIds: z.array(z.string().uuid()).max(15).default([]),
  instrumentIds: z.array(z.string().uuid()).max(15).default([]),
});

export const publishProfileSchema = z.object({
  acceptedPublicDisplay: z.literal(true, {
    message: "Tu dois accepter que ton profil soit visible publiquement.",
  }),
});

export const addMediaSchema = z.object({
  type: z.enum(["PHOTO", "VIDEO", "AUDIO_LINK", "EXTERNAL_LINK"]),
  provider: z
    .enum(["UPLOAD", "SPOTIFY", "YOUTUBE", "SOUNDCLOUD", "INSTAGRAM", "OTHER"])
    .default("OTHER"),
  url: z
    .string()
    .trim()
    .refine((val) => /^https?:\/\//.test(val) || val.startsWith("/uploads/"), "URL invalide."),
  isCover: z.boolean().optional().default(false),
});
