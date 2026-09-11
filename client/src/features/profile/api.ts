import { api } from "../../lib/api.js";

export type RefOption = { id: string; name: string };

export type MediaItem = {
  id: string;
  type: "PHOTO" | "VIDEO" | "AUDIO_LINK" | "EXTERNAL_LINK";
  provider: string;
  url: string;
  isCover: boolean;
  position: number;
};

export type CertificationSummary = {
  id: string;
  venueName: string | null;
  city: string | null;
  performanceDate: string | null;
  confirmedAt: string | null;
  review: { rating: number; comment: string | null } | null;
};

export type Availability = {
  id: string;
  startDate: string;
  endDate: string;
  isAvailable: boolean;
};

export type MusicianProfile = {
  id: string;
  profileType: "MUSICIAN" | "DJ" | "ORGANIZER" | "VENUE" | "FESTIVAL";
  displayName: string;
  bio: string | null;
  city: string | null;
  openingHours?: string | null;
  mobilityRadiusKm: number | null;
  rateMin: number | null;
  rateMax: number | null;
  rateCurrency: string;
  ratesVisible?: boolean;
  status: "DRAFT" | "PUBLISHED" | "SUSPENDED";
  viewsCount: number;
  styles: RefOption[];
  instruments: RefOption[];
  equipmentNotes: string | null;
  media: MediaItem[];
  upcomingEvents?: {
    id: string;
    title: string;
    note: string | null;
    kind: "ARTIST" | "VENUE" | "ORGANIZER" | "FESTIVAL";
    lat: number;
    lng: number;
    startsAt: string;
    endsAt: string;
  }[];
  availabilities: Availability[];
  certificationsCount: number;
  averageRating: number | null;
  certifications: CertificationSummary[];
  followersCount?: number;
  isFollowing?: boolean;
};

export async function getMyProfile() {
  const { data } = await api.get<{ profile: MusicianProfile }>("/api/profiles/me");
  return data.profile;
}

export async function updateMyProfile(input: {
  displayName: string;
  bio: string;
  city: string;
  openingHours?: string;
  mobilityRadiusKm: number | null;
  rateMin: number | null;
  rateMax: number | null;
  styleIds: string[];
  instrumentIds: string[];
}) {
  const { data } = await api.put<{ profile: MusicianProfile }>("/api/profiles/me", input);
  return data.profile;
}

export async function publishMyProfile() {
  const { data } = await api.post<{ profile: MusicianProfile }>("/api/profiles/me/publish", {
    acceptedPublicDisplay: true,
  });
  return data.profile;
}

export async function addMedia(input: {
  type: MediaItem["type"];
  provider?: string;
  url: string;
  isCover?: boolean;
}) {
  const { data } = await api.post<{ profile: MusicianProfile }>("/api/profiles/me/media", input);
  return data.profile;
}

export async function uploadPhoto(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<{ url: string }>("/api/profiles/me/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.url;
}

export async function removeMedia(mediaId: string) {
  const { data } = await api.delete<{ profile: MusicianProfile }>(`/api/profiles/me/media/${mediaId}`);
  return data.profile;
}

export async function getPublicProfile(id: string) {
  const { data } = await api.get<{ profile: MusicianProfile }>(`/api/profiles/${id}`);
  return data.profile;
}

export async function listMyAvailabilities() {
  const { data } = await api.get<{ availabilities: Availability[] }>("/api/profiles/me/availabilities");
  return data.availabilities;
}

export async function addAvailability(input: { startDate: string; endDate: string; isAvailable: boolean }) {
  const { data } = await api.post<{ availability: Availability }>(
    "/api/profiles/me/availabilities",
    input
  );
  return data.availability;
}

export async function removeAvailability(id: string) {
  await api.delete(`/api/profiles/me/availabilities/${id}`);
}

export async function getStyles() {
  const { data } = await api.get<{ styles: RefOption[] }>("/api/styles");
  return data.styles;
}

export async function getInstruments() {
  const { data } = await api.get<{ instruments: RefOption[] }>("/api/instruments");
  return data.instruments;
}
