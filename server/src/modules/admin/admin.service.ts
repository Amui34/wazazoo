import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/errors.js";

export async function listProfiles() {
  const profiles = await prisma.profile.findMany({
    include: {
      user: { select: { id: true, email: true, emailVerifiedAt: true, createdAt: true } },
      certifications: { where: { status: "CONFIRMED" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return profiles.map((p) => ({
    id: p.id,
    displayName: p.displayName,
    city: p.city,
    status: p.status,
    email: p.user.email,
    emailVerified: Boolean(p.user.emailVerifiedAt),
    certificationsCount: p.certifications.length,
    createdAt: p.createdAt,
  }));
}

export async function setProfileStatus(profileId: string, status: "PUBLISHED" | "SUSPENDED") {
  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile) {
    throw new AppError(404, "profile_not_found", "Profil introuvable.");
  }
  return prisma.profile.update({ where: { id: profileId }, data: { status } });
}

export async function listUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      emailVerifiedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listCertifications() {
  const certifications = await prisma.certification.findMany({
    include: {
      profile: { select: { id: true, displayName: true } },
      venue: { select: { id: true, name: true, city: true } },
      review: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return certifications.map((c) => ({
    id: c.id,
    status: c.status,
    musicianDisplayName: c.profile.displayName,
    venueName: c.venue?.name ?? c.claimedVenueName,
    performanceDate: c.performanceDate,
    confirmedAt: c.confirmedAt,
    createdAt: c.createdAt,
    review: c.review ? { rating: c.review.rating, comment: c.review.comment } : null,
  }));
}
