import { api } from "../../lib/api.js";

export type LiveSpot = {
  id: string;
  profileId: string;
  displayName: string;
  city: string | null;
  profileType: "MUSICIAN" | "DJ";
  coverPhotoUrl: string | null;
  lat: number;
  lng: number;
  note: string | null;
  startedAt: string;
  endsAt: string;
};

export type MyLive = { id: string; lat: number; lng: number; note: string | null; endsAt: string } | null;

export async function listActiveSpots() {
  const { data } = await api.get<{ spots: LiveSpot[] }>("/api/live/active");
  return data.spots;
}

export async function getMyLive() {
  const { data } = await api.get<{ spot: MyLive }>("/api/live/me");
  return data.spot;
}

export async function goLive(input: { lat: number; lng: number; note?: string; durationMin: number }) {
  const { data } = await api.post<{ spot: MyLive }>("/api/live", input);
  return data.spot;
}

export async function endLive() {
  await api.delete("/api/live");
}
