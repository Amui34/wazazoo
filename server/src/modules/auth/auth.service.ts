import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma.js";
import { generateToken } from "../../lib/tokens.js";
import { AppError } from "../../lib/errors.js";
import { sendMail } from "../../lib/mailer.js";
import type { z } from "zod";
import type { signupSchema, loginSchema } from "./auth.schema.js";

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

function buildVerificationUrl(token: string) {
  const clientUrl = process.env.CLIENT_URL ?? "http://localhost:5173";
  return `${clientUrl}/verifier-email?token=${token}`;
}

async function sendVerificationEmail(email: string, token: string) {
  const url = buildVerificationUrl(token);
  await sendMail({
    to: email,
    subject: "Vérifie ton email WAZA",
    html: `
      <p>Bienvenue sur WAZA !</p>
      <p>Clique sur le lien ci-dessous pour vérifier ton email et activer ton compte :</p>
      <p><a href="${url}">${url}</a></p>
      <p>Ce lien expire dans 24 heures.</p>
    `,
  });
  return url;
}

export async function signup(input: z.infer<typeof signupSchema>, ipAddress: string | undefined) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError(409, "email_taken", "Un compte existe déjà avec cet email.");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  // Mode test (phase de bêta) : on valide les comptes automatiquement pour
  // éviter d'avoir à configurer l'envoi d'emails. À DÉSACTIVER avant l'ouverture
  // au public (retirer AUTH_AUTO_VERIFY) pour rétablir la vérification par email.
  const autoVerify = process.env.AUTH_AUTO_VERIFY === "true";

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      role: input.role,
      ...(autoVerify ? { emailVerifiedAt: new Date() } : {}),
      consents: {
        create: {
          type: "TERMS",
          granted: true,
          ipAddress,
        },
      },
    },
  });

  // Un organisateur et un lieu/restaurant sont des fiches contactables : on les
  // crée dès l'inscription (publiées, nom déduit de l'email) pour qu'ils soient
  // tout de suite trouvables et présentables.
  if (user.role === "ORGANIZER" || user.role === "VENUE" || user.role === "FESTIVAL") {
    const base = input.email.split("@")[0].replace(/[._-]+/g, " ").trim();
    const fallback =
      user.role === "VENUE" ? "Établissement" : user.role === "FESTIVAL" ? "Festival" : "Organisateur";
    const displayName = base ? base.replace(/\b\w/g, (c) => c.toUpperCase()) : fallback;
    const profileType =
      user.role === "VENUE" ? "VENUE" : user.role === "FESTIVAL" ? "FESTIVAL" : "ORGANIZER";
    await prisma.profile.create({
      data: {
        userId: user.id,
        profileType,
        displayName,
        status: "PUBLISHED",
      },
    });
  }

  // En mode test auto-validé, on n'envoie pas d'email de vérification.
  if (!autoVerify) {
    const token = generateToken();
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
      },
    });
    await sendVerificationEmail(user.email, token);
  }

  return {
    user: { id: user.id, email: user.email, role: user.role },
    autoVerified: autoVerify,
  };
}

export async function verifyEmail(token: string) {
  const record = await prisma.emailVerificationToken.findUnique({ where: { token } });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new AppError(400, "invalid_token", "Ce lien de vérification est invalide ou expiré.");
  }

  await prisma.$transaction([
    prisma.emailVerificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() },
    }),
  ]);
}

export async function resendVerification(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.emailVerifiedAt) {
    return;
  }

  const token = generateToken();
  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
    },
  });

  await sendVerificationEmail(user.email, token);
}

// Hash factice comparé quand l'email n'existe pas : la réponse prend le même
// temps que pour un compte réel, ce qui empêche de deviner les emails inscrits.
const dummyHashPromise = bcrypt.hash("giglink-timing-equalizer", 12);

export async function validateCredentials(input: z.infer<typeof loginSchema>) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    await bcrypt.compare(input.password, await dummyHashPromise);
    throw new AppError(401, "invalid_credentials", "Email ou mot de passe incorrect.");
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw new AppError(401, "invalid_credentials", "Email ou mot de passe incorrect.");
  }

  if (!user.emailVerifiedAt) {
    throw new AppError(403, "email_not_verified", "Merci de vérifier ton email avant de te connecter.");
  }

  return user;
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

const RESET_TTL_MS = 1000 * 60 * 60; // 1 heure

// Demande de réinitialisation : on ne révèle jamais si l'email existe. Si l'envoi
// d'email échoue (SMTP indisponible), on n'échoue pas la requête pour autant.
export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;
  const token = generateToken();
  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt: new Date(Date.now() + RESET_TTL_MS) },
  });
  const base = process.env.CLIENT_URL ?? "http://localhost:5173";
  const link = `${base}/reinitialiser?token=${token}`;
  try {
    await sendMail({
      to: user.email,
      subject: "Réinitialise ton mot de passe WAZAZOO",
      html:
        `<p>Tu as demandé à réinitialiser ton mot de passe WAZAZOO.</p>` +
        `<p><a href="${link}">Choisir un nouveau mot de passe</a></p>` +
        `<p>Ce lien expire dans 1 heure. Si tu n'es pas à l'origine de cette demande, ignore cet email.</p>`,
    });
  } catch {
    // SMTP indisponible : la demande reste "réussie" côté utilisateur.
  }
}

// Réinitialisation effective : token valide, non utilisé, non expiré.
export async function resetPassword(token: string, newPassword: string) {
  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new AppError(400, "invalid_token", "Lien invalide ou expiré. Refais une demande.");
  }
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    // invalide ce token et tous les autres encore actifs de cet utilisateur
    prisma.passwordResetToken.updateMany({
      where: { userId: record.userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
  ]);
}

// Suppression définitive du compte + de toutes les données liées (RGPD + exigence
// Apple). Les relations User→données sont en onDelete: Cascade dans le schéma,
// donc un delete de l'utilisateur efface profil, soirées, favoris, notifications…
export async function deleteAccount(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, "user_not_found", "Compte introuvable.");
  }
  await prisma.user.delete({ where: { id: userId } });
}
