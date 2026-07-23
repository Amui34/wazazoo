import { z } from "zod";

export const goLiveSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  note: z.string().trim().max(200).optional(),
  durationMin: z.number().int().min(15).max(600).default(120),
});
