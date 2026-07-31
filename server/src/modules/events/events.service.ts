import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/errors.js";
import type { z } from "zod";
import type { createEventSchema } from "./events.schema.js";

type Role = "MUSICIAN" | "RECRUITER" | "ADMIN";

export async function createEvent(
  userId: string,
  role: Role,
  input: z.infer<typeof createEventSchema>
) {
  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(input.endsAt);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    throw new AppError(400, "invalid_date", "Dates invalides.");
  }
  if (endsAt <= startsAt) {
    throw new AppError(400, "invalid_range", "L'heure de fin doit être après le début.");
  }
  if (endsAt < new Date()) {
    throw new AppError(400, "past_event", "Cet événement est déjà terminé.");
  }

  if (role === "MUSICIAN") {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      throw new AppError(404, "profile_not_found", "Crée d'abord ton profil d'artiste.");
    }
    return prisma.event.create({
      data: {
        ownerUserId: userId,
        profileId: profile.id,
        kind: "ARTIST",
        title: input.title?.trim() || profile.displayName,
        note: input.note ?? null,
        lat: input.lat,
        lng: input.lng,
        startsAt,
        endsAt,
      },
    });
  }

  if (role === "RECRUITER") {
    if (!input.title || input.title.trim().length < 2) {
      throw new AppError(400, "title_required", "Donne un titre à ton événement.");
    }
    return prisma.event.create({
      data: {
        ownerUserId: userId,
        kind: "VENUE",
        title: input.title.trim(),
        note: input.note ?? null,
        lat: input.lat,
        lng: input.lng,
        startsAt,
        endsAt,
      },
    });
  }

  throw new AppError(403, "forbidden", "Action non autorisée.");
}

export async function listActive() {
  const events = await prisma.event.findMany({
    where: { endsAt: { gt: new Date() } },
    include: {
      profile: {
        select: {
          id: true,
          displayName: true,
          city: true,
          media: { where: { isCover: true }, take: 1, select: { url: true } },
        },
      },
    },
    orderBy: { startsAt: "asc" },
  });

  return events.map((e) => ({
    id: e.id,
    kind: e.kind,
    title: e.title,
    note: e.note,
    lat: e.lat,
    lng: e.lng,
    startsAt: e.startsAt,
    endsAt: e.endsAt,
    profileId: e.profileId,
    city: e.profile?.city ?? null,
    coverPhotoUrl: e.profile?.media[0]?.url ?? null,
  }));
}

export async function listMine(userId: string) {
  return prisma.event.findMany({
    where: { ownerUserId: userId, endsAt: { gt: new Date() } },
    orderBy: { startsAt: "asc" },
  });
}

export async function deleteEvent(id: string, userId: string) {
  const ev = await prisma.event.findUnique({ where: { id } });
  if (!ev || ev.ownerUserId !== userId) {
    throw new AppError(404, "event_not_found", "Événement introuvable.");
  }
  await prisma.event.delete({ where: { id } });
}
