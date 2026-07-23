import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/errors.js";
import type { z } from "zod";
import type { goLiveSchema } from "./live.schema.js";

async function ownProfile(userId: string) {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) {
    throw new AppError(404, "profile_not_found", "Crée d'abord ton profil d'artiste.");
  }
  return profile;
}

export async function goLive(userId: string, input: z.infer<typeof goLiveSchema>) {
  const profile = await ownProfile(userId);
  const endsAt = new Date(Date.now() + input.durationMin * 60_000);
  await prisma.liveSpot.upsert({
    where: { profileId: profile.id },
    update: { lat: input.lat, lng: input.lng, note: input.note ?? null, startedAt: new Date(), endsAt },
    create: { profileId: profile.id, lat: input.lat, lng: input.lng, note: input.note ?? null, endsAt },
  });
  return getMine(userId);
}

export async function endLive(userId: string) {
  const profile = await ownProfile(userId);
  await prisma.liveSpot.deleteMany({ where: { profileId: profile.id } });
}

export async function getMine(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: { liveSpot: true },
  });
  const spot = profile?.liveSpot;
  if (!spot || spot.endsAt < new Date()) return null;
  return { id: spot.id, lat: spot.lat, lng: spot.lng, note: spot.note, endsAt: spot.endsAt };
}

export async function listActive() {
  const spots = await prisma.liveSpot.findMany({
    where: { endsAt: { gt: new Date() } },
    include: {
      profile: {
        select: {
          id: true,
          displayName: true,
          city: true,
          profileType: true,
          media: { where: { isCover: true }, take: 1, select: { url: true } },
        },
      },
    },
    orderBy: { startedAt: "desc" },
  });

  return spots.map((s) => ({
    id: s.id,
    profileId: s.profile.id,
    displayName: s.profile.displayName,
    city: s.profile.city,
    profileType: s.profile.profileType,
    coverPhotoUrl: s.profile.media[0]?.url ?? null,
    lat: s.lat,
    lng: s.lng,
    note: s.note,
    startedAt: s.startedAt,
    endsAt: s.endsAt,
  }));
}
