import { api } from "../../lib/api.js";
import type { Venue } from "../venues/api.js";

export type Certification = {
  id: string;
  status: "PENDING" | "CONFIRMED" | "DECLINED" | "EXPIRED";
  claimedVenueName: string | null;
  performanceDate: string | null;
  inviteToken: string;
  venue: Venue | null;
  review: { rating: number; comment: string | null } | null;
};

export async function createCertification(input: { claimedVenueName: string; performanceDate?: string }) {
  const { data } = await api.post<{ certification: Certification }>("/api/certifications", input);
  return data.certification;
}

export async function listMyCertifications() {
  const { data } = await api.get<{ certifications: Certification[] }>("/api/certifications/mine");
  return data.certifications;
}

export async function getCertificationByToken(token: string) {
  const { data } = await api.get<{
    certification: {
      id: string;
      status: string;
      claimedVenueName: string | null;
      performanceDate: string | null;
      musicianDisplayName: string;
      musicianProfileId: string;
      venue: Venue | null;
    };
  }>(`/api/certifications/token/${token}`);
  return data.certification;
}

export async function confirmCertification(
  token: string,
  input: { venueId?: string; newVenue?: { name: string; city?: string } }
) {
  const { data } = await api.post<{ certification: Certification }>(
    `/api/certifications/token/${token}/confirm`,
    input
  );
  return data.certification;
}

export async function submitReview(certificationId: string, input: { rating: number; comment?: string }) {
  await api.post(`/api/certifications/${certificationId}/review`, input);
}
