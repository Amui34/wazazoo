import { prisma } from "../../lib/prisma.js";

export async function list(userId: string) {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const unreadCount = await prisma.notification.count({ where: { userId, readAt: null } });
  return { notifications, unreadCount };
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}

// Crée une notification pour tous les suiveurs d'un profil (ex. passage en live).
export async function notifyFollowers(
  profileId: string,
  opts: { type: string; message: string; link?: string }
) {
  const followers = await prisma.follow.findMany({
    where: { profileId },
    select: { userId: true },
  });
  if (followers.length === 0) return;
  await prisma.notification.createMany({
    data: followers.map((f) => ({
      userId: f.userId,
      type: opts.type,
      message: opts.message,
      link: opts.link ?? null,
    })),
  });
}
