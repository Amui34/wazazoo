import { api } from "../../lib/api.js";

export type Venue = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  description: string | null;
};

export async function listMyVenues() {
  const { data } = await api.get<{ venues: Venue[] }>("/api/venues/mine");
  return data.venues;
}

export async function createVenue(input: { name: string; address?: string; city?: string }) {
  const { data } = await api.post<{ venue: Venue }>("/api/venues", input);
  return data.venue;
}
