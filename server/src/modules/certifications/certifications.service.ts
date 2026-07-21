import { prisma } from "../../lib/prisma.js";
import { generateToken } from "../../lib/tokens.js";
import { AppError } from "../../lib/errors.js";
import type { z } from "zod";
import type { createCertificationSchema, confirmCertificationSchema, reviewSchema } from "./certifications.schema.js";

const INVITE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export async function createCertification(
  musicianUserId: string,
  input: z.infer<typeof createCertificationSchema>
) {
  const profile = await prisma.profile.findUnique({ where: { userId: musicianUserId } });
  if (!profile) {
    throw new AppError(404, "profile_not_found", "Crée d'abord ton profil musicien.");
  }

  const certification = await prisma.certification.create({
    data: {
      profileId: profile.id,
      claimedVenueName: input.claimedVenueName,
      performanceDate: input.performanceDate ? new Date(input.performanceDate) : null,
      inviteToken: generateToken(),
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    },
  });

  return certification;
}

export async function listMyCertifications(musicianUserId: string) {
  const profile = await prisma.profile.findUnique({ where: { userId: musicianUserId } });
  if (!profile) return [];

  return prisma.certification.findMany({
    where: { profileId: profile.id },
    include: { venue: true, review: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getByToken(token: string) {
  const certification = await prisma.certification.findUnique({
    where: { inviteToken: token },
    include: { profile: true, venue: true },
  });

  if (!certification) {
    throw new AppError(404, "certification_not_found", "Ce lien de certification est invalide.");
  }

  return certification;
}

export async function confirmByToken(
  token: string,
  recruiterUserId: string,
  input: z.infer<typeof confirmCertificationSchema>
) {
  const certification = await prisma.certification.findUnique({ where: { inviteToken: token } });
  if (!certification) {
    throw new AppError(404, "certification_not_found", "Ce lien de certification est invalide.");
  }
  if (certification.status !== "PENDING") {
    throw new AppError(400, "already_handled", "Cette certification a déjà été traitée.");
  }
  if (certification.expiresAt && certification.expiresAt < new Date()) {
    throw new AppError(400, "invite_expired", "Ce lien de certification a expiré.");
  }

  let venueId: string;
  if (input.venueId) {
    const venue = await prisma.venue.findUnique({ where: { id: input.venueId } });
    if (!venue || venue.contactUserId !== recruiterUserId) {
      throw new AppError(403, "forbidden", "Ce lieu ne t'appartient pas.");
    }
    venueId = venue.id;
  } else {
    const venue = await prisma.venue.create({
      data: {
        name: input.newVenue!.name,
        city: input.newVenue!.city || null,
        contactUserId: recruiterUserId,
      },
    });
    venueId = venue.id;
  }

  return prisma.certification.update({
    where: { id: certification.id },
    data: {
      venueId,
      status: "CONFIRMED",
      confirmedAt: new Date(),
      confirmedByUserId: recruiterUserId,
    },
    include: { venue: true, profile: true },
  });
}

export async function addReview(
  certificationId: string,
  recruiterUserId: string,
  input: z.infer<typeof reviewSchema>
) {
  const certification = await prisma.certification.findUnique({
    where: { id: certificationId },
    include: { venue: true, review: true },
  });

  if (!certification || certification.status !== "CONFIRMED" || !certification.venue) {
    throw new AppError(404, "certification_not_found", "Certification introuvable ou non confirmée.");
  }
  if (certification.venue.contactUserId !== recruiterUserId) {
    throw new AppError(403, "forbidden", "Cette certification ne t'appartient pas.");
  }
  if (certification.review) {
    throw new AppError(409, "review_exists", "Un avis existe déjà pour cette prestation.");
  }

  return prisma.review.create({
    data: {
      certificationId: certification.id,
      rating: input.rating,
      comment: input.comment || null,
    },
  });
}
