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

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      role: input.role,
      consents: {
        create: {
          type: "TERMS",
          granted: true,
          ipAddress,
        },
      },
    },
  });

  // Un organisateur est une fiche contactable : on la crée dès l'inscription
  // (publiée, nom déduit de l'email) pour qu'il soit tout de suite trouvable.
  if (user.role === "ORGANIZER") {
    const base = input.email.split("@")[0].replace(/[._-]+/g, " ").trim();
    const displayName = base ? base.replace(/\b\w/g, (c) => c.toUpperCase()) : "Organisateur";
    await prisma.profile.create({
      data: {
        userId: user.id,
        profileType: "ORGANIZER",
        displayName,
        status: "PUBLISHED",
      },
    });
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

  return {
    user: { id: user.id, email: user.email, role: user.role },
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
