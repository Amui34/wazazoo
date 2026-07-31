import { z } from "zod";

export const createEventSchema = z.object({
  title: z.string().trim().max(120).optional(),
  note: z.string().trim().max(300).optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  startsAt: z.string().min(1, "Date de début requise."),
  endsAt: z.string().min(1, "Date de fin requise."),
});
