import { api } from "../../lib/api.js";
import type { RefOption } from "../profile/api.js";

export type SearchResult = {
  id: string;
  profileType: "MUSICIAN" | "DJ" | "ORGANIZER";
  isGroup: boolean;
  displayName: string;
  city: string | null;
  bio: string | null;
  rateMin: number | null;
  rateMax: number | null;
  coverPhotoUrl: string | null;
  styles: RefOption[];
  instruments: RefOption[];
  certificationsCount: number;
  averageRating: number | null;
};

export async function searchMusicians(filters: {
  kind?: "MUSICIAN" | "GROUP" | "DJ" | "ORGANIZER";
  styleId?: string;
  instrumentId?: string;
  city?: string;
  date?: string;
  budgetMax?: number;
  minCertifications?: number;
}) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== "")
  );
  const { data } = await api.get<{ results: SearchResult[] }>("/api/search/musicians", { params });
  return data.results;
}
