import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/errors.js";
import type { z } from "zod";
import type { createContactRequestSchema } from "./contact-requests.schema.js";

export async function createContactRequest(
  recruiterUserId: string,
  input: z.infer<typeof createContactRequestSchema>
) {
  const profile = await prisma.profile.findUnique({ where: { id: input.profileId } });
  if (!profile || profile.status !== "PUBLISHED") {
    throw new AppError(404, "profile_not_found", "Profil introuvable.");
  }
  if (profile.userId === recruiterUserId) {
    throw new AppError(400, "self_contact", "Tu ne peux pas te contacter toi-même.");
  }

  return prisma.contactRequest.create({
    data: {
      recruiterId: recruiterUserId,
      profileId: profile.id,
      message: input.message,
    },
  });
}

export async function listReceived(musicianUserId: string) {
  const profile = await prisma.profile.findUnique({ where: { userId: musicianUserId } });
  if (!profile) return [];

  return prisma.contactRequest.findMany({
    where: { profileId: profile.id },
    include: { recruiter: { select: { id: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function listSent(recruiterUserId: string) {
  return prisma.contactRequest.findMany({
    where: { recruiterId: recruiterUserId },
    include: { profile: { select: { id: true, displayName: true } } },
    orderBy: { createdAt: "desc" },
  });
}

async function assertMusicianOwnsRequest(contactRequestId: string, musicianUserId: string) {
  const contactRequest = await prisma.contactRequest.findUnique({
    where: { id: contactRequestId },
    include: { profile: true },
  });
  if (!contactRequest || contactRequest.profile.userId !== musicianUserId) {
    throw new AppError(404, "contact_request_not_found", "Demande introuvable.");
  }
  if (contactRequest.status !== "PENDING") {
    throw new AppError(400, "already_handled", "Cette demande a déjà été traitée.");
  }
  return contactRequest;
}

export async function acceptContactRequest(contactRequestId: string, musicianUserId: string) {
  const contactRequest = await assertMusicianOwnsRequest(contactRequestId, musicianUserId);
  const user = await prisma.user.findUnique({ where: { id: musicianUserId } });

  const disclosedFields = ["email", ...(user?.phone ? ["phone"] : [])];

  await prisma.$transaction([
    prisma.contactRequest.update({
      where: { id: contactRequest.id },
      data: { status: "ACCEPTED", respondedAt: new Date() },
    }),
    prisma.consent.create({
      data: { userId: musicianUserId, type: "CONTACT_SHARING", granted: true },
    }),
    ...disclosedFields.map((field) =>
      prisma.contactDisclosure.create({
        data: { contactRequestId: contactRequest.id, disclosedField: field },
      })
    ),
  ]);
}

export async function declineContactRequest(contactRequestId: string, musicianUserId: string) {
  const contactRequest = await assertMusicianOwnsRequest(contactRequestId, musicianUserId);
  await prisma.contactRequest.update({
    where: { id: contactRequest.id },
    data: { status: "DECLINED", respondedAt: new Date() },
  });
}

export async function getContactRequestDetail(
  contactRequestId: string,
  requesterUserId: string,
  ipAddress?: string
) {
  const contactRequest = await prisma.contactRequest.findUnique({
    where: { id: contactRequestId },
    include: {
      profile: { include: { user: true } },
      recruiter: { select: { id: true, email: true } },
    },
  });

  if (!contactRequest) {
    throw new AppError(404, "contact_request_not_found", "Demande introuvable.");
  }

  const isRecruiter = contactRequest.recruiterId === requesterUserId;
  const isMusician = contactRequest.profile.userId === requesterUserId;
  if (!isRecruiter && !isMusician) {
    throw new AppError(403, "forbidden", "Accès refusé.");
  }

  const contactInfo =
    contactRequest.status === "ACCEPTED"
      ? {
          email: contactRequest.profile.user.email,
          phone: contactRequest.profile.user.phone,
        }
      : null;

  // RGPD : trace chaque consultation effective des coordonnées par le recruteur.
  if (contactInfo && isRecruiter) {
    await prisma.contactAccessLog.create({
      data: { contactRequestId: contactRequest.id, viewerUserId: requesterUserId, ipAddress },
    });
  }

  return {
    id: contactRequest.id,
    status: contactRequest.status,
    message: contactRequest.message,
    createdAt: contactRequest.createdAt,
    respondedAt: contactRequest.respondedAt,
    profile: { id: contactRequest.profile.id, displayName: contactRequest.profile.displayName },
    recruiter: contactRequest.recruiter,
    contactInfo,
  };
}
