import { z } from "zod";

export const sendMessageSchema = z.object({
  body: z.string().trim().min(1, "Le message ne peut pas être vide.").max(4000, "Message trop long."),
});
