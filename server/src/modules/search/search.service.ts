import { prisma } from "../../lib/prisma.js";

export type SearchFilters = {
  styleId?: string;
  city?: string;
  budgetMax?: number;
  minCertifications?: number;
  profileType?: "MUSICIAN" | "DJ";
};

export async function searchMusicians(filters: SearchFilters) {
  const profiles = await prisma.profile.findMany({
    where: {
      profileType: filters.profileType ?? { in: ["MUSICIAN", "DJ"] },
      status: "PUBLISHED",
      ...(filters.city ? { city: { contains: filters.city, mode: "insensitive" } } : {}),
      ...(filters.styleId
        ? {
            OR: [
              { musicianProfile: { styles: { some: { styleId: filters.styleId } } } },
              { djProfile: { styles: { some: { styleId: filters.styleId } } } },
            ],
          }
        : {}),
    },
    include: {
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
      media: { where: { isCover: true }, take: 1 },
      certifications: {
        where: { status: "CONFIRMED" },
        include: { review: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const shaped = profiles.map((profile) => {
    const reviews = profile.certifications
      .map((c) => c.review)
      .filter((r): r is NonNullable<typeof r> => Boolean(r));
    const averageRating = reviews.length
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

    return {
      id: profile.id,
      profileType: profile.profileType,
      displayName: profile.displayName,
      city: profile.city,
      bio: profile.bio,
      rateMin: profile.rateMin,
      rateMax: profile.rateMax,
      coverPhotoUrl: profile.media[0]?.url ?? null,
      styles:
        profile.profileType === "DJ"
          ? profile.djProfile?.styles.map((s) => s.style) ?? []
          : profile.musicianProfile?.styles.map((s) => s.style) ?? [],
      instruments: profile.musicianProfile?.instruments.map((i) => i.instrument) ?? [],
      certificationsCount: profile.certifications.length,
      averageRating,
    };
  });

  return shaped
    .filter((p) => (filters.budgetMax != null ? p.rateMin == null || p.rateMin <= filters.budgetMax : true))
    .filter((p) => (filters.minCertifications != null ? p.certificationsCount >= filters.minCertifications : true))
    .sort((a, b) => b.certificationsCount - a.certificationsCount);
}
