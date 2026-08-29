import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/errors.js";
import type { z } from "zod";
import type { sendMessageSchema } from "./messages.schema.js";

// Nom lisible du demandeur : son nom de profil s'il en a un (organisateur,
// musicien), sinon un email embelli (contact@le-petit-bistrot → « Le Petit Bistrot »).
function requesterName(recruiter: { email: string; profile?: { displayName: string } | null }) {
  if (recruiter.profile?.displayName) return recruiter.profile.displayName;
  const base = recruiter.email.split("@")[0].replace(/[._-]+/g, " ").trim();
  return base ? base.replace(/\b\w/g, (c) => c.toUpperCase()) : recruiter.email;
}

// Charge une conversation et vérifie que l'utilisateur en fait partie et
// que la demande a bien été acceptée (RGPD : pas de messagerie avant accord).
async function loadThread(contactRequestId: string, userId: string) {
  const cr = await prisma.contactRequest.findUnique({
    where: { id: contactRequestId },
    include: {
      profile: { select: { id: true, userId: true, displayName: true } },
      recruiter: { select: { id: true, email: true, profile: { select: { displayName: true } } } },
    },
  });
  if (!cr) {
    throw new AppError(404, "conversation_not_found", "Conversation introuvable.");
  }
  const isRecruiter = cr.recruiterId === userId;
  const isMusician = cr.profile.userId === userId;
  if (!isRecruiter && !isMusician) {
    throw new AppError(403, "forbidden", "Accès refusé.");
  }
  if (cr.status !== "ACCEPTED") {
    throw new AppError(403, "not_accepted", "La conversation n'est ouverte qu'après acceptation de la demande.");
  }
  return { cr, isRecruiter };
}

export async function listConversations(userId: string) {
  const rows = await prisma.contactRequest.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ recruiterId: userId }, { profile: { userId } }],
    },
    include: {
      profile: { select: { id: true, displayName: true } },
      recruiter: { select: { id: true, email: true, profile: { select: { displayName: true } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const conversations = await Promise.all(
    rows.map(async (cr) => {
      const isRecruiter = cr.recruiterId === userId;
      const unreadCount = await prisma.message.count({
        where: { contactRequestId: cr.id, senderUserId: { not: userId }, readAt: null },
      });
      const last = cr.messages[0];
      return {
        contactRequestId: cr.id,
        profileId: cr.profile.id,
        otherName: isRecruiter ? cr.profile.displayName : requesterName(cr.recruiter),
        role: isRecruiter ? ("RECRUITER" as const) : ("MUSICIAN" as const),
        lastMessage: last?.body ?? null,
        lastAt: last?.createdAt ?? cr.respondedAt ?? cr.createdAt,
        unreadCount,
      };
    })
  );

  conversations.sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
  return conversations;
}

export async function getThread(contactRequestId: string, userId: string) {
  const { cr, isRecruiter } = await loadThread(contactRequestId, userId);

  // Marque comme lus les messages reçus de l'autre partie.
  await prisma.message.updateMany({
    where: { contactRequestId, senderUserId: { not: userId }, readAt: null },
    data: { readAt: new Date() },
  });

  const messages = await prisma.message.findMany({
    where: { contactRequestId },
    orderBy: { createdAt: "asc" },
  });

  return {
    contactRequestId,
    otherName: isRecruiter ? cr.profile.displayName : cr.recruiter.email,
    profileId: cr.profile.id,
    messages: messages.map((m) => ({
      id: m.id,
      body: m.body,
      mine: m.senderUserId === userId,
      createdAt: m.createdAt,
    })),
  };
}

export async function sendMessage(
  contactRequestId: string,
  userId: string,
  input: z.infer<typeof sendMessageSchema>
) {
  await loadThread(contactRequestId, userId);
  const msg = await prisma.message.create({
    data: { contactRequestId, senderUserId: userId, body: input.body },
  });
  return { id: msg.id, body: msg.body, mine: true, createdAt: msg.createdAt };
}
