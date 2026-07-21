import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../lib/errors.js";
import type { z } from "zod";
import type { updateDjProfileSchema } from "./dj.schema.js";

const djProfileInclude = {
  djProfile: {
    include: {
      styles: { include: { style: true } },
    },
  },
  media: { orderBy: { position: "asc" as const } },
  availabilities: { orderBy: { startDate: "asc" as const } },
  certifications: {
    where: { status: "CONFIRMED" as const },
    include: { venue: true, review: true },
    orderBy: { confirmedAt: "desc" as const },
  },
};

function shapeDjProfile(profile: NonNullable<Awaited<ReturnType<typeof findDjProfile>>>) {
  const confirmedCertifications = profile.certifications;
  const reviews = confirmedCertifications.map((c) => c.review).filter((r): r is NonNullable<typeof r> => Boolean(r));
  const averageRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null;

  return {
    id: profile.id,
    profileType: "DJ" as const,
    displayName: profile.displayName,
    bio: profile.bio,
    city: profile.city,
    mobilityRadiusKm: profile.mobilityRadiusKm,
    rateMin: profile.rateMin,
    rateMax: profile.rateMax,
    rateCurrency: profile.rateCurrency,
    status: profile.status,
    equipmentNotes: profile.djProfile?.equipmentNotes ?? null,
    styles: profile.djProfile?.styles.map((s) => s.style) ?? [],
    media: profile.media,
    availabilities: profile.availabilities
      .filter((a) => a.endDate >= new Date())
      .map((a) => ({ id: a.id, startDate: a.startDate, endDate: a.endDate, isAvailable: a.isAvailable })),
    certificationsCount: confirmedCertifications.length,
    averageRating,
    certifications: confirmedCertifications.map((c) => ({
      id: c.id,
      venueName: c.venue?.name ?? c.claimedVenueName,
      city: c.venue?.city ?? null,
      performanceDate: c.performanceDate,
      confirmedAt: c.confirmedAt,
      review: c.review ? { rating: c.review.rating, comment: c.review.comment } : null,
    })),
  };
}

function findDjProfile(profileId: string) {
  return prisma.profile.findUnique({ where: { id: profileId }, include: djProfileInclude });
}

export async function getOwnDjProfileOrNull(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: djProfileInclude,
  });
  if (!profile || profile.profileType !== "DJ") return null;
  return shapeDjProfile(profile);
}

async function ensureDjProfileRow(userId: string) {
  const existing = await prisma.profile.findUnique({ where: { userId } });
  if (existing) {
    if (existing.profileType !== "DJ") {
      throw new AppError(
        409,
        "profile_type_conflict",
        "Un profil d'un autre type existe déjà pour ce compte."
      );
    }
    return existing;
  }

  return prisma.profile.create({
    data: {
      userId,
      profileType: "DJ",
      displayName: "",
      djProfile: { create: {} },
    },
  });
}

async function getOwnDjProfile(userId: string) {
  const profile = await prisma.profile.findUnique({ where: { userId }, include: djProfileInclude });
  return shapeDjProfile(profile!);
}

export async function updateOwnDjProfile(userId: string, input: z.infer<typeof updateDjProfileSchema>) {
  const profile = await ensureDjProfileRow(userId);

  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      displayName: input.displayName,
      bio: input.bio || null,
      city: input.city || null,
      mobilityRadiusKm: input.mobilityRadiusKm ?? null,
      rateMin: input.rateMin ?? null,
      rateMax: input.rateMax ?? null,
      djProfile: {
        update: {
          equipmentNotes: input.equipmentNotes || null,
          styles: {
            deleteMany: {},
            create: input.styleIds.map((styleId) => ({ styleId })),
          },
        },
      },
    },
  });

  return getOwnDjProfile(userId);
}

export async function publishOwnDjProfile(userId: string, ipAddress: string | undefined) {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile || profile.profileType !== "DJ") {
    throw new AppError(404, "profile_not_found", "Profil introuvable.");
  }
  if (!profile.displayName || !profile.bio || !profile.city) {
    throw new AppError(
      400,
      "profile_incomplete",
      "Complète au moins ton nom, ta bio et ta ville avant de publier."
    );
  }

  await prisma.$transaction([
    prisma.profile.update({ where: { id: profile.id }, data: { status: "PUBLISHED" } }),
    prisma.consent.create({
      data: { userId, type: "PUBLIC_PROFILE", granted: true, ipAddress },
    }),
  ]);

  return getOwnDjProfile(userId);
}
