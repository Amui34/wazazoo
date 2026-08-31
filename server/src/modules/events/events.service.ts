import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/errors.js";
import { notifyFollowers } from "../notifications/notifications.service.js";
import type { z } from "zod";
import type { createEventSchema } from "./events.schema.js";

type Role = "MUSICIAN" | "RECRUITER" | "ADMIN" | "TOURIST" | "ORGANIZER" | "FESTIVAL" | "VENUE";

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
    const event = await prisma.event.create({
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
    // Prévient les abonnés de l'artiste (favoris → notifications).
    const isLiveNow = startsAt <= new Date();
    await notifyFollowers(profile.id, {
      type: "ARTIST_LIVE",
      message: isLiveNow
        ? `🔴 ${event.title} est en live maintenant !`
        : `🎤 ${event.title} a programmé un événement.`,
      link: `/musiciens/${profile.id}`,
    }).catch(() => {});
    return event;
  }

  if (role === "RECRUITER" || role === "ORGANIZER" || role === "FESTIVAL" || role === "VENUE") {
    if (!input.title || input.title.trim().length < 2) {
      throw new AppError(400, "title_required", "Donne un titre à ton événement.");
    }
    const kind = role === "ORGANIZER" ? "ORGANIZER" : role === "FESTIVAL" ? "FESTIVAL" : "VENUE";
    return prisma.event.create({
      data: {
        ownerUserId: userId,
        kind,
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
          profileType: true,
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
    profileType: e.profile?.profileType ?? null,
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
