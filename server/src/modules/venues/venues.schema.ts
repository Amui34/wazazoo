import { z } from "zod";

export const createVenueSchema = z.object({
  name: z.string().trim().min(2, "2 caractères minimum.").max(120),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
});
