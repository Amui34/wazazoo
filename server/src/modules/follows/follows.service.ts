import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/errors.js";

export async function follow(userId: string, profileId: string) {
  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile) {
    throw new AppError(404, "profile_not_found", "Profil introuvable.");
  }
  if (profile.userId === userId) {
    throw new AppError(400, "cannot_follow_self", "Tu ne peux pas te suivre toi-même.");
  }
  await prisma.follow.upsert({
    where: { userId_profileId: { userId, profileId } },
    update: {},
    create: { userId, profileId },
  });
}

export async function unfollow(userId: string, profileId: string) {
  await prisma.follow.deleteMany({ where: { userId, profileId } });
}

export async function listMine(userId: string) {
  const follows = await prisma.follow.findMany({
    where: { userId },
    include: {
      profile: {
        select: {
          id: true,
          displayName: true,
          city: true,
          profileType: true,
          status: true,
          media: { where: { isCover: true }, take: 1, select: { url: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return follows.map((f) => ({
    id: f.profile.id,
    displayName: f.profile.displayName,
    city: f.profile.city,
    profileType: f.profile.profileType,
    coverPhotoUrl: f.profile.media[0]?.url ?? null,
  }));
}
