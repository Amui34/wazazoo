/**
 * Seed additif : ~50 lieux (bars, restos, clubs, guinguettes…) autour de
 * Montpellier, chacun avec une fiche VENUE publiée + des soirées à venir
 * (c'est ce qui les fait apparaître sur la carte).
 *
 * Idempotent : ne touche qu'à ses propres entités (emails `lieu.mtp.*`).
 * N'efface pas le reste. Lancer avec :
 *   docker compose exec server npx tsx prisma/seed-montpellier.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const DEMO_PASSWORD = "Demo1234!";
const HOUR = 60 * 60 * 1000;

// RNG déterministe (mulberry32) pour un résultat reproductible.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260831);
const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const jitter = (v: number, amp: number) => v + (rand() - 0.5) * amp;

// Quartiers de Montpellier + communes autour, avec coordonnées réelles.
const AREAS: { name: string; city: string; lat: number; lng: number }[] = [
  { name: "Comédie", city: "Montpellier", lat: 43.6089, lng: 3.8797 },
  { name: "Écusson", city: "Montpellier", lat: 43.6112, lng: 3.8772 },
  { name: "Antigone", city: "Montpellier", lat: 43.6083, lng: 3.8865 },
  { name: "Port Marianne", city: "Montpellier", lat: 43.5989, lng: 3.8944 },
  { name: "Les Arceaux", city: "Montpellier", lat: 43.6135, lng: 3.8659 },
  { name: "Boutonnet", city: "Montpellier", lat: 43.6209, lng: 3.871 },
  { name: "Beaux-Arts", city: "Montpellier", lat: 43.6175, lng: 3.879 },
  { name: "Figuerolles", city: "Montpellier", lat: 43.606, lng: 3.862 },
  { name: "Les Aubes", city: "Montpellier", lat: 43.611, lng: 3.893 },
  { name: "Gambetta", city: "Montpellier", lat: 43.6075, lng: 3.87 },
  { name: "Le Peyrou", city: "Montpellier", lat: 43.6116, lng: 3.8712 },
  { name: "Celleneuve", city: "Montpellier", lat: 43.6165, lng: 3.833 },
  { name: "Millénaire", city: "Montpellier", lat: 43.6035, lng: 3.908 },
  { name: "Odysseum", city: "Montpellier", lat: 43.6046, lng: 3.9203 },
  { name: "Lattes", city: "Lattes", lat: 43.5686, lng: 3.9033 },
  { name: "Pérols", city: "Pérols", lat: 43.5646, lng: 3.9515 },
  { name: "Palavas-les-Flots", city: "Palavas-les-Flots", lat: 43.5285, lng: 3.93 },
  { name: "Castelnau-le-Lez", city: "Castelnau-le-Lez", lat: 43.6317, lng: 3.9022 },
  { name: "Le Crès", city: "Le Crès", lat: 43.636, lng: 3.928 },
  { name: "Juvignac", city: "Juvignac", lat: 43.6135, lng: 3.806 },
  { name: "Grabels", city: "Grabels", lat: 43.648, lng: 3.814 },
  { name: "Saint-Jean-de-Védas", city: "Saint-Jean-de-Védas", lat: 43.5738, lng: 3.828 },
  { name: "Clapiers", city: "Clapiers", lat: 43.6534, lng: 3.876 },
  { name: "Jacou", city: "Jacou", lat: 43.656, lng: 3.906 },
  { name: "Montferrier-sur-Lez", city: "Montferrier-sur-Lez", lat: 43.669, lng: 3.862 },
  { name: "La Grande-Motte", city: "La Grande-Motte", lat: 43.562, lng: 4.087 },
  { name: "Villeneuve-lès-Maguelone", city: "Villeneuve-lès-Maguelone", lat: 43.546, lng: 3.862 },
];

// Noms masculins / féminins pour choisir le bon article (Le / La / L').
const MASC = [
  "Comptoir", "Perchoir", "Cellier", "Zinc", "Fût", "Cabanon", "Refuge", "Caveau",
  "Kiosque", "Atelier", "Bocal", "Phare", "Débarcadère", "Hangar", "Cargo", "Bistrot",
];
const FEM = [
  "Cale", "Guinguette", "Tonnelle", "Terrasse", "Grange", "Buvette", "Tanière",
  "Sirène", "Escale", "Baraque", "Cave", "Cour", "Halle", "Cabane",
];
const FIRSTNAMES = ["Simone", "Marcel", "Lulu", "Nine", "Jo", "Régine", "Gaby", "Fanny", "Loulou", "Mémé"];
const QUALIFIERS = [
  "des Arceaux", "du Lez", "de l'Écusson", "d'Antigone", "de la Comédie", "du Peyrou",
  "des Beaux-Arts", "de Boutonnet", "du Port", "de la Mer", "des Aubes", "du Verdanson",
  "de Figuerolles", "des Halles", "du Marché", "des Tritons", "du Soleil", "de la Plage",
  "de la Gare", "du Château d'Eau",
];

const startsWithVowel = (w: string) => /^[aeiouyàâäéèêëîïôöûü]/i.test(w);
function buildName(): string {
  // ~15% de bistrots « Chez … »
  if (rand() < 0.15) return `Chez ${pick(FIRSTNAMES)}`;
  const fem = rand() < 0.5;
  const noun = fem ? pick(FEM) : pick(MASC);
  const article = startsWithVowel(noun) ? "L'" : fem ? "La " : "Le ";
  const qual = rand() < 0.6 ? " " + pick(QUALIFIERS) : "";
  return `${article}${noun}${qual}`;
}
const KINDS = [
  { label: "Bar à vins", cover: "cave à vins & petites assiettes" },
  { label: "Brasserie", cover: "bière artisanale & cuisine de partage" },
  { label: "Club", cover: "club électro, sets prolongés" },
  { label: "Rooftop", cover: "toit-terrasse, cocktails au coucher du soleil" },
  { label: "Guinguette", cover: "guinguette au bord de l'eau, ambiance dansante" },
  { label: "Café-concert", cover: "café-concert intimiste, scène ouverte" },
  { label: "Restaurant", cover: "cuisine du marché & scène live le week-end" },
  { label: "Taverne", cover: "taverne conviviale, planches & concerts" },
  { label: "Bistrot", cover: "bistrot de quartier, apéros musicaux" },
  { label: "Salle de concert", cover: "salle de concert, live tous les styles" },
];
const HOURS = [
  "Mar–Sam 18h–1h",
  "Mer–Dim 17h–2h",
  "Jeu–Sam 19h–2h · concerts dès 21h",
  "Tous les jours 12h–00h",
  "Lun–Sam 11h–1h · brunch le dimanche",
  "Mar–Dim 18h–2h",
  "Ven–Sam 21h–5h (club)",
  "Mer–Dim 12h–15h & 19h–00h",
];
const SOIREES = [
  { t: "DJ set house", n: "House & disco jusqu'au bout de la nuit 🎧" },
  { t: "Concert live jazz", n: "Trio jazz en formation acoustique 🎷" },
  { t: "Jam session ouverte", n: "Scène ouverte, ramène ton instrument 🎸" },
  { t: "Soirée funk & soul", n: "Cuivres, groove et boule à facettes ✨" },
  { t: "Afterwork électro", n: "Sunset, cocktails & deep house 🌇" },
  { t: "Blind test musical", n: "Équipes, lots à gagner, ambiance 🎉" },
  { t: "Bal trad occitan", n: "Danses trad et buvette locale 💃" },
  { t: "Open mic & slam", n: "Micro ouvert : chant, slam, humour 🎤" },
  { t: "Soirée latino", n: "Salsa, bachata, reggaeton 🌶️" },
  { t: "Set techno", n: "Line-up techno, deux salles 🖤" },
  { t: "Concert rock", n: "Groupe local, guitares dehors 🤘" },
  { t: "Guinguette dansante", n: "Musette, valse et pastis au bord du Lez 🪗" },
  { t: "Vinyles & tapas", n: "Sélection 100% vinyles, tapas maison 🍢" },
  { t: "Karaoké live", n: "Karaoké accompagné par un groupe live 🎶" },
  { t: "Chill rooftop", n: "Lo-fi, transats et vue sur la ville 🌆" },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  // Génère 50 noms uniques.
  const usedNames = new Set<string>();
  const venues: {
    email: string;
    name: string;
    city: string;
    bio: string;
    openingHours: string;
    lat: number;
    lng: number;
  }[] = [];

  let guard = 0;
  while (venues.length < 50 && guard < 5000) {
    guard += 1;
    const name = buildName();
    if (usedNames.has(name)) continue;
    usedNames.add(name);

    const area = AREAS[venues.length % AREAS.length];
    const kind = pick(KINDS);
    const bio = `${kind.label} à ${area.name} (${area.city}) — ${kind.cover}. On accueille DJ et groupes : suis-nous pour ne rien rater de nos soirées.`;
    venues.push({
      // Email stable par index : relancer le script met à jour les mêmes 50 lieux.
      email: `lieu.mtp.${venues.length + 1}@waza.test`,
      name,
      city: area.city,
      bio,
      openingHours: pick(HOURS),
      lat: jitter(area.lat, 0.008),
      lng: jitter(area.lng, 0.008),
    });
  }

  let venueCount = 0;
  let eventCount = 0;
  for (const v of venues) {
    const user = await prisma.user.upsert({
      where: { email: v.email },
      update: {},
      create: { email: v.email, passwordHash, role: "VENUE", emailVerifiedAt: new Date() },
    });
    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        displayName: v.name,
        bio: v.bio,
        city: v.city,
        openingHours: v.openingHours,
        status: "PUBLISHED",
      },
      create: {
        userId: user.id,
        profileType: "VENUE",
        displayName: v.name,
        bio: v.bio,
        city: v.city,
        openingHours: v.openingHours,
        status: "PUBLISHED",
      },
    });
    venueCount += 1;

    // On repart des soirées de ce lieu (idempotent) puis on en crée 1 à 3.
    await prisma.event.deleteMany({ where: { ownerUserId: user.id } });
    const nbSoirees = 1 + Math.floor(rand() * 3); // 1..3
    for (let k = 0; k < nbSoirees; k++) {
      const s = pick(SOIREES);
      // Réparti sur les 3 prochaines semaines ; ~1 sur 10 « en ce moment ».
      const liveNow = rand() < 0.1 && k === 0;
      const startH = liveNow ? -1 : Math.floor(rand() * 21 * 24) + 2;
      const durH = 3 + Math.floor(rand() * 4);
      await prisma.event.create({
        data: {
          ownerUserId: user.id,
          profileId: profile.id,
          kind: "VENUE",
          title: s.t,
          note: s.n,
          lat: jitter(v.lat, 0.0015),
          lng: jitter(v.lng, 0.0015),
          startsAt: new Date(Date.now() + startH * HOUR),
          endsAt: new Date(Date.now() + (startH + durH) * HOUR),
        },
      });
      eventCount += 1;
    }
  }

  console.log(`✅ ${venueCount} lieux autour de Montpellier créés, ${eventCount} soirées à venir.`);
  console.log(`   Connexion démo : n'importe quel email lieu.mtp.* / mot de passe ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
