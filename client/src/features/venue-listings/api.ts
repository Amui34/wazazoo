import { api } from "../../lib/api.js";

// Lieux réels (OpenStreetMap) affichés « de base » sur la carte, revendiquables
// par le gérant. À ne pas confondre avec features/venues (lieux de certification).
export type VenueListing = {
  id: string;
  name: string;
  category: string; // bar | pub | nightclub | cafe | restaurant
  lat: number;
  lng: number;
  address: string | null;
  city: string | null;
  openingHours: string | null;
  website: string | null;
  claimed: boolean;
  claimedProfileId: string | null;
};

export type Bbox = { south: number; west: number; north: number; east: number };

export async function listVenueListings(bbox: Bbox, limit = 300) {
  const b = `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;
  const { data } = await api.get<{ listings: VenueListing[] }>("/api/venue-listings", {
    params: { bbox: b, limit },
  });
  return data.listings;
}

export async function claimListing(id: string) {
  const { data } = await api.post<{ claimedProfileId: string; listingId: string }>(
    `/api/venue-listings/${id}/claim`
  );
  return data;
}

export async function unclaimListing(id: string) {
  await api.delete(`/api/venue-listings/${id}/claim`);
}

export async function getMyClaimedListing() {
  const { data } = await api.get<{ listing: VenueListing | null }>("/api/venue-listings/mine");
  return data.listing;
}
