import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/errors.js";

export type Bbox = { south: number; west: number; north: number; east: number };

// Lieux réels (OSM) dans une zone visible de la carte. Limité pour ne pas
// envoyer des milliers de points d'un coup.
export async function listInBbox(bbox: Bbox, opts: { limit?: number; category?: string } = {}) {
  const limit = Math.min(opts.limit ?? 300, 600);
  const listings = await prisma.venueListing.findMany({
    where: {
      lat: { gte: bbox.south, lte: bbox.north },
      lng: { gte: bbox.west, lte: bbox.east },
      ...(opts.category ? { category: opts.category } : {}),
    },
    take: limit,
    include: {
      claimedProfile: { select: { id: true, displayName: true, status: true } },
    },
  });

  return listings.map((l) => ({
    id: l.id,
    name: l.name,
    category: l.category,
    lat: l.lat,
    lng: l.lng,
    address: l.address,
    city: l.city,
    openingHours: l.openingHours,
    website: l.website,
    // Revendiqué = géré par l'établissement (fiche publiée reliée).
    claimed: !!l.claimedProfile && l.claimedProfile.status === "PUBLISHED",
    claimedProfileId: l.claimedProfile?.status === "PUBLISHED" ? l.claimedProfile.id : null,
  }));
}

// Le gérant (compte VENUE) revendique un lieu : on relie sa fiche au listing.
export async function claim(userId: string, listingId: string) {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile || profile.profileType !== "VENUE") {
    throw new AppError(403, "not_a_venue", "Seul un compte « Lieu / Restaurant » peut revendiquer un lieu.");
  }
  const listing = await prisma.venueListing.findUnique({ where: { id: listingId } });
  if (!listing) {
    throw new AppError(404, "listing_not_found", "Lieu introuvable.");
  }
  if (listing.claimedProfileId && listing.claimedProfileId !== profile.id) {
    throw new AppError(409, "already_claimed", "Ce lieu est déjà géré par un autre compte.");
  }
  // Un compte ne gère qu'un lieu : on libère un éventuel autre listing revendiqué.
  await prisma.venueListing.updateMany({
    where: { claimedProfileId: profile.id, NOT: { id: listingId } },
    data: { claimedProfileId: null },
  });
  await prisma.venueListing.update({
    where: { id: listingId },
    data: { claimedProfileId: profile.id },
  });
  // Pré-remplit la fiche avec les infos réelles si elles sont vides.
  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      city: profile.city ?? listing.city ?? undefined,
      openingHours: profile.openingHours ?? listing.openingHours ?? undefined,
    },
  });
  return { claimedProfileId: profile.id, listingId };
}

export async function unclaim(userId: string, listingId: string) {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) throw new AppError(404, "profile_not_found", "Profil introuvable.");
  await prisma.venueListing.updateMany({
    where: { id: listingId, claimedProfileId: profile.id },
    data: { claimedProfileId: null },
  });
  return { ok: true };
}

// Le listing revendiqué par le compte courant (pour l'éditeur de fiche).
export async function myClaim(userId: string) {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) return null;
  return prisma.venueListing.findFirst({ where: { claimedProfileId: profile.id } });
}
