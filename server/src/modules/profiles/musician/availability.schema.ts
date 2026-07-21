import { z } from "zod";

export const createAvailabilitySchema = z
  .object({
    startDate: z.string().min(1, "Date de début requise."),
    endDate: z.string().min(1, "Date de fin requise."),
    isAvailable: z.boolean().default(true),
  })
  .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
    message: "La date de fin doit être après la date de début.",
    path: ["endDate"],
  });
