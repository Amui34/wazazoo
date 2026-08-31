import type { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../lib/errors.js";
import type { z } from "zod";
import type { updateProfileSchema, addMediaSchema } from "./profile.schema.js";

const publicProfileInclude = {
  musicianProfile: {
    include: {
      styles: { include: { style: true } },
      instruments: { include: { instrument: true } },
    },
  },
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

function shapePublicProfile(profile: NonNullable<Awaited<ReturnType<typeof findProfileWithRelations>>>) {
  const confirmedCertifications = profile.certifications;
  const reviews = confirmedCertifications.map((c) => c.review).filter((r): r is NonNullable<typeof r> => Boolean(r));
  const averageRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null;

  return {
    id: profile.id,
    profileType: profile.profileType,
    displayName: profile.displayName,
    bio: profile.bio,
    city: profile.city,
    mobilityRadiusKm: profile.mobilityRadiusKm,
    rateMin: profile.rateMin,
    rateMax: profile.rateMax,
    rateCurrency: profile.rateCurrency,
    openingHours: profile.openingHours,
    status: profile.status,
    viewsCount: profile.viewsCount,
    styles:
      profile.profileType === "DJ"
        ? profile.djProfile?.styles.map((s) => s.style) ?? []
        : profile.musicianProfile?.styles.map((s) => s.style) ?? [],
    instruments: profile.musicianProfile?.instruments.map((i) => i.instrument) ?? [],
    equipmentNotes: profile.djProfile?.equipmentNotes ?? null,
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

function findProfileWithRelations(profileId: string) {
  return prisma.profile.findUnique({
    where: { id: profileId },
    include: publicProfileInclude,
  });
}

export async function getOwnProfileOrNull(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: publicProfileInclude,
  });
  // Les organisateurs et les lieux/restaurants éditent leur fiche via ce même
  // endpoint (fiche contactable générique) ; les DJ ont leur propre éditeur.
  if (!profile || profile.profileType === "DJ") return null;
  return shapePublicProfile(profile);
}

export async function getOrCreateOwnProfile(userId: string) {
  let profile = await prisma.profile.findUnique({
    where: { userId },
    include: publicProfileInclude,
  });

  if (!profile) {
    await prisma.profile.create({
      data: {
        userId,
        profileType: "MUSICIAN",
        displayName: "",
        musicianProfile: { create: {} },
      },
    });
    profile = await prisma.profile.findUnique({
      where: { userId },
      include: publicProfileInclude,
    });
  }

  return shapePublicProfile(profile!);
}

async function ensureProfileRow(userId: string) {
  const existing = await prisma.profile.findUnique({ where: { userId } });
  if (existing) {
    // Les DJ ont leur propre éditeur ; musiciens, organisateurs et lieux
    // passent par ici. On ne bloque que sur un conflit avec un profil DJ.
    if (existing.profileType === "DJ") {
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
      profileType: "MUSICIAN",
      displayName: "",
      musicianProfile: { create: {} },
    },
  });
}

export async function updateOwnProfile(userId: string, input: z.infer<typeof updateProfileSchema>) {
  const profile = await ensureProfileRow(userId);

  // Champs communs à toutes les fiches (musicien, organisateur, lieu).
  const data: Prisma.ProfileUpdateInput = {
    displayName: input.displayName,
    bio: input.bio || null,
    city: input.city || null,
    openingHours: input.openingHours || null,
    mobilityRadiusKm: input.mobilityRadiusKm ?? null,
    rateMin: input.rateMin ?? null,
    rateMax: input.rateMax ?? null,
  };

  // Styles/instruments n'existent que pour les musiciens.
  if (profile.profileType === "MUSICIAN") {
    data.musicianProfile = {
      update: {
        styles: {
          deleteMany: {},
          create: input.styleIds.map((styleId) => ({ styleId })),
        },
        instruments: {
          deleteMany: {},
          create: input.instrumentIds.map((instrumentId) => ({ instrumentId })),
        },
      },
    };
  }

  await prisma.profile.update({ where: { id: profile.id }, data });

  return getOrCreateOwnProfile(userId);
}

export async function publishOwnProfile(userId: string, ipAddress: string | undefined) {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) {
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

  return getOrCreateOwnProfile(userId);
}

export async function getPublicProfile(
  profileId: string,
  viewerUserId: string | undefined,
  viewerRole: string | undefined
) {
  const profile = await findProfileWithRelations(profileId);
  if (!profile) {
    throw new AppError(404, "profile_not_found", "Profil introuvable.");
  }
  if (profile.status !== "PUBLISHED" && profile.userId !== viewerUserId) {
    throw new AppError(404, "profile_not_found", "Profil introuvable.");
  }
  // Compteur de vues anonyme : on compte les visiteurs autres que le propriétaire.
  if (profile.status === "PUBLISHED" && profile.userId !== viewerUserId) {
    prisma.profile
      .update({ where: { id: profile.id }, data: { viewsCount: { increment: 1 } } })
      .catch(() => {});
  }

  const followersCount = await prisma.follow.count({ where: { profileId } });
  const isFollowing = viewerUserId
    ? (await prisma.follow.count({ where: { userId: viewerUserId, profileId } })) > 0
    : false;

  // Le tarif des prestations n'est visible que par le propriétaire et par les
  // potentiels recruteurs (recruteur, organisateur, festival, admin) — pas par
  // les visiteurs lambda ni les touristes.
  const isOwner = profile.userId === viewerUserId;
  const isPro =
    !!viewerRole && ["RECRUITER", "ORGANIZER", "FESTIVAL", "ADMIN"].includes(viewerRole);
  const ratesVisible = isOwner || isPro;

  const shaped = shapePublicProfile(profile);
  return {
    ...shaped,
    rateMin: ratesVisible ? shaped.rateMin : null,
    rateMax: ratesVisible ? shaped.rateMax : null,
    ratesVisible,
    followersCount,
    isFollowing,
  };
}

export async function addMedia(userId: string, input: z.infer<typeof addMediaSchema>) {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) {
    throw new AppError(404, "profile_not_found", "Profil introuvable.");
  }

  if (input.isCover) {
    await prisma.mediaItem.updateMany({
      where: { profileId: profile.id, isCover: true },
      data: { isCover: false },
    });
  }

  const count = await prisma.mediaItem.count({ where: { profileId: profile.id } });

  await prisma.mediaItem.create({
    data: {
      profileId: profile.id,
      type: input.type,
      provider: input.provider,
      url: input.url,
      isCover: input.isCover,
      position: count,
    },
  });

  return getOrCreateOwnProfile(userId);
}

export async function removeMedia(userId: string, mediaId: string) {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) {
    throw new AppError(404, "profile_not_found", "Profil introuvable.");
  }

  const media = await prisma.mediaItem.findUnique({ where: { id: mediaId } });
  if (!media || media.profileId !== profile.id) {
    throw new AppError(404, "media_not_found", "Média introuvable.");
  }

  await prisma.mediaItem.delete({ where: { id: mediaId } });
  return getOrCreateOwnProfile(userId);
}

export async function listStyles() {
  return prisma.musicalStyle.findMany({ orderBy: { name: "asc" } });
}

export async function listInstruments() {
  return prisma.instrument.findMany({ orderBy: { name: "asc" } });
}
