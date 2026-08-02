import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(10, "Le mot de passe doit contenir au moins 10 caractères.")
  .max(200, "Mot de passe trop long.")
  .regex(/[a-z]/, "Ajoute au moins une lettre minuscule.")
  .regex(/[A-Z]/, "Ajoute au moins une lettre majuscule.")
  .regex(/[0-9]/, "Ajoute au moins un chiffre.");

export const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalide."),
  password: passwordSchema,
  role: z.enum(["MUSICIAN", "RECRUITER", "TOURIST", "ORGANIZER", "FESTIVAL"], {
    message: "Rôle invalide.",
  }),
  acceptedTerms: z.literal(true, {
    message: "Vous devez accepter les conditions d'utilisation.",
  }),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalide."),
  password: z.string().min(1, "Mot de passe requis."),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token requis."),
});

export const resendVerificationSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalide."),
});
