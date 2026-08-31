/**
 * Importe de VRAIS lieux (bars, pubs, clubs, cafés, restaurants) autour de
 * Montpellier depuis OpenStreetMap (Overpass API) dans la table VenueListing.
 * Données OpenStreetMap © contributeurs, sous licence ODbL.
 *
 * Ce sont des « fiches non revendiquées » : elles s'affichent sur la carte par
 * défaut. Quand le gérant crée son compte et revendique le lieu, on relie
 * claimedProfileId à sa fiche.
 *
 * Idempotent (upsert par sourceRef). Un snapshot est écrit dans
 * prisma/data/montpellier-osm.json pour rejouer hors-ligne.
 *
 *   docker compose exec server npx tsx prisma/seed-venues-osm.ts
 */
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

// Emprise : Montpellier + communes proches (Lattes, Castelnau, Pérols, Grabels,
// Juvignac, Le Crès, Clapiers…). [sud, ouest, nord, est]
const BBOX = [43.52, 3.78, 43.68, 3.98] as const;
const AMENITIES = "bar|pub|nightclub|biergarten|cafe|restaurant";
const SNAPSHOT = path.join(process.cwd(), "prisma", "data", "montpellier-osm.json");

type OverpassEl = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

const OVERPASS_MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

async function fetchOverpass(): Promise<OverpassEl[]> {
  const [s, w, n, e] = BBOX;
  const q = `[out:json][timeout:60];(node["amenity"~"^(${AMENITIES})$"](${s},${w},${n},${e});way["amenity"~"^(${AMENITIES})$"](${s},${w},${n},${e}););out center tags;`;
  let lastErr: unknown;
  for (const url of OVERPASS_MIRRORS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          "User-Agent": "WAZAZOO/1.0 (venue listing import; contact demo)",
        },
        body: "data=" + encodeURIComponent(q),
      });
      if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
      const json = (await res.json()) as { elements: OverpassEl[] };
      console.log(`🌍 ${json.elements?.length ?? 0} éléments reçus de ${new URL(url).host}`);
      return json.elements ?? [];
    } catch (err) {
      lastErr = err;
      console.warn(`   ⚠︎ ${new URL(url).host} : ${(err as Error).message} — miroir suivant…`);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Overpass indisponible");
}

function loadElements(): Promise<OverpassEl[]> {
  // Si un snapshot existe, on le rejoue (hors-ligne, stable).
  if (fs.existsSync(SNAPSHOT)) {
    console.log(`↩︎  Snapshot trouvé, lecture de ${path.relative(process.cwd(), SNAPSHOT)}`);
    return Promise.resolve(JSON.parse(fs.readFileSync(SNAPSHOT, "utf8")));
  }
  return fetchOverpass().then((els) => {
    fs.mkdirSync(path.dirname(SNAPSHOT), { recursive: true });
    fs.writeFileSync(SNAPSHOT, JSON.stringify(els));
    console.log(`💾 Snapshot écrit : ${path.relative(process.cwd(), SNAPSHOT)} (${els.length} éléments)`);
    return els;
  });
}

function addressOf(t: Record<string, string>): string | null {
  const parts = [
    [t["addr:housenumber"], t["addr:street"]].filter(Boolean).join(" "),
    [t["addr:postcode"], t["addr:city"]].filter(Boolean).join(" "),
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

async function main() {
  const elements = await loadElements();
  let imported = 0;
  let skipped = 0;

  for (const el of elements) {
    const t = el.tags ?? {};
    const name = t.name?.trim();
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (!name || lat == null || lng == null) {
      skipped += 1;
      continue;
    }
    const sourceRef = `${el.type}/${el.id}`;
    const data = {
      name,
      category: t.amenity ?? "bar",
      lat,
      lng,
      address: addressOf(t),
      city: t["addr:city"] ?? "Montpellier",
      openingHours: t.opening_hours ?? null,
      website: t.website ?? t["contact:website"] ?? null,
      phone: t.phone ?? t["contact:phone"] ?? null,
    };
    await prisma.venueListing.upsert({
      where: { sourceRef },
      update: data,
      create: { source: "osm", sourceRef, ...data },
    });
    imported += 1;
  }

  const byCat = await prisma.venueListing.groupBy({ by: ["category"], _count: true });
  console.log(`✅ ${imported} lieux réels importés (${skipped} ignorés sans nom/coordonnées).`);
  console.log("   Répartition :", byCat.map((c) => `${c.category}: ${c._count}`).join(" · "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
