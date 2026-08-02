import { api } from "../../lib/api.js";

export type WazaEvent = {
  id: string;
  kind: "ARTIST" | "VENUE" | "ORGANIZER" | "FESTIVAL";
  title: string;
  note: string | null;
  lat: number;
  lng: number;
  startsAt: string;
  endsAt: string;
  profileId: string | null;
  profileType: "MUSICIAN" | "DJ" | null;
  city: string | null;
  coverPhotoUrl: string | null;
};

export type MyEvent = {
  id: string;
  kind: "ARTIST" | "VENUE" | "ORGANIZER";
  title: string;
  note: string | null;
  lat: number;
  lng: number;
  startsAt: string;
  endsAt: string;
};

export async function listActiveEvents() {
  const { data } = await api.get<{ events: WazaEvent[] }>("/api/events/active");
  return data.events;
}

export async function listMyEvents() {
  const { data } = await api.get<{ events: MyEvent[] }>("/api/events/mine");
  return data.events;
}

export async function createEvent(input: {
  title?: string;
  note?: string;
  lat: number;
  lng: number;
  startsAt: string;
  endsAt: string;
}) {
  const { data } = await api.post<{ event: MyEvent }>("/api/events", input);
  return data.event;
}

export async function deleteEvent(id: string) {
  await api.delete(`/api/events/${id}`);
}
