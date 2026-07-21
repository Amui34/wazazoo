import { prisma } from "../../../lib/prisma.js";
import { AppError } from "../../../lib/errors.js";
import type { z } from "zod";
import type { createAvailabilitySchema } from "./availability.schema.js";

export async function listMyAvailabilities(userId: string) {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) return [];

  return prisma.availability.findMany({
    where: { profileId: profile.id },
    orderBy: { startDate: "asc" },
  });
}

export async function createAvailability(
  userId: string,
  input: z.infer<typeof createAvailabilitySchema>
) {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) {
    throw new AppError(404, "profile_not_found", "Crée d'abord ton profil musicien.");
  }

  return prisma.availability.create({
    data: {
      profileId: profile.id,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      isAvailable: input.isAvailable,
    },
  });
}

export async function removeAvailability(userId: string, availabilityId: string) {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) {
    throw new AppError(404, "profile_not_found", "Profil introuvable.");
  }

  const availability = await prisma.availability.findUnique({ where: { id: availabilityId } });
  if (!availability || availability.profileId !== profile.id) {
    throw new AppError(404, "availability_not_found", "Disponibilité introuvable.");
  }

  await prisma.availability.delete({ where: { id: availabilityId } });
}
