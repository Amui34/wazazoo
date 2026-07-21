import { z } from "zod";

export const createContactRequestSchema = z.object({
  profileId: z.string().uuid(),
  message: z.string().trim().min(10, "Décris ton besoin en quelques mots (10 caractères min).").max(2000),
});
