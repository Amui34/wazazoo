import { prisma } from "../../lib/prisma.js";

export type SearchFilters = {
  styleId?: string;
  city?: string;
  budgetMax?: number;
  minCertifications?: number;
  // kind : type d'artiste — solo, groupe, ou DJ.
  kind?: "MUSICIAN" | "GROUP" | "DJ";
  // date de l'événement (ISO) : garde les artistes disponibles ce jour-là
  // (ou dont la disponibilité n'est pas renseignée).
  date?: string;
};

function kindWhere(kind: SearchFilters["kind"]) {
  switch (kind) {
    case "MUSICIAN":
      return { profileType: "MUSICIAN" as const, isGroup: false };
    case "GROUP":
      return { isGroup: true };
    case "DJ":
      return { profileType: "DJ" as const };
    default:
      return { profileType: { in: ["MUSICIAN", "DJ"] as const } };
  }
}

export async function searchMusicians(filters: SearchFilters) {
  const and: any[] = [];
  if (filters.styleId) {
    and.push({
      OR: [
        { musicianProfile: { styles: { some: { styleId: filters.styleId } } } },
        { djProfile: { styles: { some: { styleId: filters.styleId } } } },
      ],
    });
  }
  if (filters.date) {
    const d = new Date(filters.date);
    if (!Number.isNaN(d.getTime())) {
      and.push({
        OR: [
          { availabilities: { none: {} } },
          { availabilities: { some: { startDate: { lte: d }, endDate: { gte: d } } } },
        ],
      });
    }
  }

  const profiles = await prisma.profile.findMany({
    where: {
      status: "PUBLISHED",
      ...kindWhere(filters.kind),
      ...(filters.city ? { city: { contains: filters.city, mode: "insensitive" } } : {}),
      ...(and.length ? { AND: and } : {}),
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
      isGroup: profile.isGroup,
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
