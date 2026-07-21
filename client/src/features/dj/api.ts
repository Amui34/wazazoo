import { api } from "../../lib/api.js";
import type { RefOption, MediaItem, CertificationSummary, Availability } from "../profile/api.js";

export type DjProfile = {
  id: string;
  profileType: "DJ";
  displayName: string;
  bio: string | null;
  city: string | null;
  mobilityRadiusKm: number | null;
  rateMin: number | null;
  rateMax: number | null;
  rateCurrency: string;
  status: "DRAFT" | "PUBLISHED" | "SUSPENDED";
  equipmentNotes: string | null;
  styles: RefOption[];
  media: MediaItem[];
  availabilities: Availability[];
  certificationsCount: number;
  averageRating: number | null;
  certifications: CertificationSummary[];
};

export async function getMyDjProfile() {
  const { data } = await api.get<{ profile: DjProfile | null }>("/api/profiles/dj/me");
  return data.profile;
}

export async function updateMyDjProfile(input: {
  displayName: string;
  bio: string;
  city: string;
  mobilityRadiusKm: number | null;
  rateMin: number | null;
  rateMax: number | null;
  equipmentNotes: string;
  styleIds: string[];
}) {
  const { data } = await api.put<{ profile: DjProfile }>("/api/profiles/dj/me", input);
  return data.profile;
}

export async function publishMyDjProfile() {
  const { data } = await api.post<{ profile: DjProfile }>("/api/profiles/dj/me/publish", {
    acceptedPublicDisplay: true,
  });
  return data.profile;
}
