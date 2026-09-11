import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import crypto from "node:crypto";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Demo1234!";

const STYLES = [
  "Jazz",
  "Rock",
  "Pop",
  "Électro",
  "Chanson française",
  "Reggae",
  "Blues",
  "Classique",
  "Funk / Soul",
  "Latino",
  "Variété",
  "Hip-Hop",
];

const INSTRUMENTS = [
  "Guitare",
  "Piano / Clavier",
  "Chant",
  "Batterie",
  "Basse",
  "Saxophone",
  "Violon",
  "Trompette",
  "Accordéon",
  "Percussions",
];

const RECRUITERS = [
  { email: "contact@le-petit-bistrot.demo.giglink.app", venueName: "Le Petit Bistrot", city: "Paris" },
  { email: "booking@salle-eclipse.demo.giglink.app", venueName: "Salle Éclipse", city: "Lyon" },
  { email: "contact@comptoir-du-sud.demo.giglink.app", venueName: "Le Comptoir du Sud", city: "Marseille" },
  { email: "booking@entrepot-toulouse.demo.giglink.app", venueName: "L'Entrepôt", city: "Toulouse" },
  { email: "contact@bar-le-central.demo.giglink.app", venueName: "Bar Le Central", city: "Nantes" },
];

const REVIEW_COMMENTS = [
  "Super prestation, public conquis, on recommande !",
  "Ponctuel, pro, et une ambiance parfaite du début à la fin.",
  "Exactement ce qu'on cherchait pour notre soirée, à rebooker sans hésiter.",
  "Très bon accueil des clients, répertoire varié et bien senti.",
  "Prestation solide, matériel nickel, aucun souci d'organisation.",
];

const MUSICIANS = [
  {
    email: "clara.jazz@demo.giglink.app",
    displayName: "Clara Moreau",
    bio: "Chanteuse jazz depuis 10 ans, j'anime des soirées feutrées en trio ou en solo avec looper. Répertoire standards + reprises pop en version jazzy.",
    city: "Paris",
    mobilityRadiusKm: 40,
    rateMin: 250,
    rateMax: 450,
    styles: ["Jazz", "Blues", "Variété"],
    instruments: ["Chant", "Piano / Clavier"],
    cover: "https://i.pravatar.cc/500?img=47",
    venues: [0, 2],
    links: [{ type: "EXTERNAL_LINK", provider: "SPOTIFY", url: "https://open.spotify.com/artist/demo-clara" }],
  },
  {
    email: "malik.guitare@demo.giglink.app",
    displayName: "Malik Benali",
    bio: "Guitariste-chanteur, ambiance chaleureuse pour restaurants et mariages. Répertoire pop/rock/reggae, acoustique ou avec loop station.",
    city: "Lyon",
    mobilityRadiusKm: 60,
    rateMin: 200,
    rateMax: 380,
    styles: ["Reggae", "Rock", "Pop"],
    instruments: ["Guitare", "Chant"],
    cover: "https://i.pravatar.cc/500?img=12",
    venues: [1],
    links: [],
  },
  {
    email: "sofia.violon@demo.giglink.app",
    displayName: "Sofia Rossi",
    bio: "Violoniste classique et musiques du monde, disponible en solo, duo ou quatuor pour cérémonies et événements d'entreprise.",
    city: "Marseille",
    mobilityRadiusKm: 80,
    rateMin: 300,
    rateMax: 600,
    styles: ["Classique", "Latino"],
    instruments: ["Violon"],
    cover: "https://i.pravatar.cc/500?img=32",
    venues: [2, 0, 1],
    links: [{ type: "EXTERNAL_LINK", provider: "YOUTUBE", url: "https://youtube.com/@demo-sofia" }],
  },
  {
    email: "theo.funk@demo.giglink.app",
    displayName: "Théo Lambert",
    bio: "Bassiste groove, dispo pour compléter votre groupe ou pour des sets funk/soul en formation réduite.",
    city: "Bordeaux",
    mobilityRadiusKm: 50,
    rateMin: 180,
    rateMax: 320,
    styles: ["Funk / Soul", "Hip-Hop"],
    instruments: ["Basse", "Percussions"],
    cover: "https://i.pravatar.cc/500?img=15",
    venues: [3],
    links: [],
  },
  {
    email: "amelie.piano@demo.giglink.app",
    displayName: "Amélie Fontaine",
    bio: "Pianiste polyvalente, répertoire chanson française et variété internationale, parfaite pour cocktails et brunchs.",
    city: "Paris",
    mobilityRadiusKm: 30,
    rateMin: 220,
    rateMax: 400,
    styles: ["Chanson française", "Variété", "Pop"],
    instruments: ["Piano / Clavier", "Chant"],
    cover: "https://i.pravatar.cc/500?img=25",
    venues: [0, 4],
    links: [],
  },
  {
    email: "yanis.traore@demo.giglink.app",
    displayName: "Yanis Traoré",
    bio: "Percussionniste et beatmaker, sets énergiques hip-hop/funk pour soirées privées et lancements de marque.",
    city: "Toulouse",
    mobilityRadiusKm: 70,
    rateMin: 220,
    rateMax: 420,
    styles: ["Hip-Hop", "Funk / Soul"],
    instruments: ["Percussions", "Chant"],
    cover: "https://i.pravatar.cc/500?img=51",
    venues: [3],
    links: [],
  },
  {
    email: "emma.dubois@demo.giglink.app",
    displayName: "Emma Dubois",
    bio: "Chanteuse-batteuse, formation pop/rock/électro pour bars et festivals. Set solo avec machines ou en duo batterie/chant.",
    city: "Nantes",
    mobilityRadiusKm: 60,
    rateMin: 200,
    rateMax: 400,
    styles: ["Pop", "Rock", "Électro"],
    instruments: ["Chant", "Batterie"],
    cover: "https://i.pravatar.cc/500?img=44",
    venues: [4, 1],
    links: [{ type: "EXTERNAL_LINK", provider: "INSTAGRAM", url: "https://instagram.com/demo.emma" }],
  },
  {
    email: "lucas.petit@demo.giglink.app",
    displayName: "Lucas Petit",
    bio: "Guitariste-saxophoniste, ambiance blues/rock/jazz pour bars à concerts et clubs.",
    city: "Lille",
    mobilityRadiusKm: 55,
    rateMin: 210,
    rateMax: 390,
    styles: ["Blues", "Rock", "Jazz"],
    instruments: ["Guitare", "Saxophone"],
    cover: "https://i.pravatar.cc/500?img=8",
    venues: [],
    links: [],
  },
  {
    email: "chloe.martin@demo.giglink.app",
    displayName: "Chloé Martin",
    bio: "Violoniste et pianiste, répertoire classique et chanson française pour cérémonies, cocktails et événements haut de gamme.",
    city: "Nice",
    mobilityRadiusKm: 50,
    rateMin: 280,
    rateMax: 550,
    styles: ["Classique", "Chanson française"],
    instruments: ["Violon", "Piano / Clavier"],
    cover: "https://i.pravatar.cc/500?img=29",
    venues: [2],
    links: [],
  },
  {
    email: "karim.haddad@demo.giglink.app",
    displayName: "Karim Haddad",
    bio: "DJ-batteur hybride, sets électro/hip-hop live pour clubs et after-work.",
    city: "Strasbourg",
    mobilityRadiusKm: 90,
    rateMin: 250,
    rateMax: 500,
    styles: ["Électro", "Hip-Hop"],
    instruments: ["Batterie", "Basse"],
    cover: "https://i.pravatar.cc/500?img=18",
    venues: [1, 3],
    links: [{ type: "EXTERNAL_LINK", provider: "SOUNDCLOUD", url: "https://soundcloud.com/demo-karim" }],
  },
  {
    email: "lea.girard@demo.giglink.app",
    displayName: "Léa Girard",
    bio: "Chanteuse-accordéoniste, ambiance guinguette et variété latino pour mariages et fêtes de village.",
    city: "Montpellier",
    mobilityRadiusKm: 65,
    rateMin: 190,
    rateMax: 350,
    styles: ["Latino", "Variété", "Pop"],
    instruments: ["Chant", "Accordéon"],
    cover: "https://i.pravatar.cc/500?img=36",
    venues: [2, 4],
    links: [],
  },
  {
    email: "nathan.roy@demo.giglink.app",
    displayName: "Nathan Roy",
    bio: "Guitariste-batteur multi-instrumentiste, dispo pour compléter un groupe rock/blues ou jouer en duo acoustique.",
    city: "Paris",
    mobilityRadiusKm: 45,
    rateMin: 200,
    rateMax: 360,
    styles: ["Rock", "Blues"],
    instruments: ["Guitare", "Batterie"],
    cover: "https://i.pravatar.cc/500?img=53",
    venues: [],
    links: [],
  },
  {
    email: "ines.bernard@demo.giglink.app",
    displayName: "Inès Bernard",
    bio: "Saxophoniste-pianiste, sets jazz/funk pour cocktails d'entreprise et brunchs dominicaux.",
    city: "Lyon",
    mobilityRadiusKm: 50,
    rateMin: 230,
    rateMax: 420,
    styles: ["Jazz", "Funk / Soul"],
    instruments: ["Saxophone", "Piano / Clavier"],
    cover: "https://i.pravatar.cc/500?img=41",
    venues: [1],
    links: [],
  },
  {
    email: "hugo.faure@demo.giglink.app",
    displayName: "Hugo Faure",
    bio: "Guitariste-percussionniste, répertoire reggae/latino pour terrasses et bars de plage.",
    city: "Marseille",
    mobilityRadiusKm: 40,
    rateMin: 170,
    rateMax: 300,
    styles: ["Reggae", "Latino"],
    instruments: ["Guitare", "Percussions"],
    cover: "https://i.pravatar.cc/500?img=60",
    venues: [2],
    links: [],
  },
  {
    email: "manon.leclerc@demo.giglink.app",
    displayName: "Manon Leclerc",
    bio: "Chanteuse-violoniste, répertoire chanson française et classique léger pour cérémonies laïques et dîners privés.",
    city: "Bordeaux",
    mobilityRadiusKm: 35,
    rateMin: 240,
    rateMax: 430,
    styles: ["Chanson française", "Classique"],
    instruments: ["Chant", "Violon"],
    cover: "https://i.pravatar.cc/500?img=23",
    venues: [3, 0],
    links: [],
  },

  // --- Groupes / formations ---
  {
    email: "contact@lesnuitsfauves.demo.giglink.app",
    isGroup: true,
    displayName: "Les Nuits Fauves",
    bio: "Groupe pop-rock électro à 5 musiciens. Show énergique avec batterie live, synthés et section chant. Idéal soirées d'entreprise et festivals.",
    city: "Paris",
    mobilityRadiusKm: 200,
    rateMin: 600,
    rateMax: 1200,
    styles: ["Pop", "Rock", "Électro"],
    instruments: ["Chant", "Guitare", "Batterie", "Basse"],
    cover: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&h=600&fit=crop&q=80",
    venues: [0, 1],
    links: [{ type: "EXTERNAL_LINK", provider: "SPOTIFY", url: "https://open.spotify.com/artist/demo-nuitsfauves" }],
  },
  {
    email: "booking@brassrepublik.demo.giglink.app",
    isGroup: true,
    displayName: "Brass Républik",
    bio: "Fanfare funk-soul de 7 cuivres. Déambulation ou set sur scène, groove garanti pour mariages, inaugurations et carnavals.",
    city: "Lyon",
    mobilityRadiusKm: 150,
    rateMin: 700,
    rateMax: 1400,
    styles: ["Funk / Soul", "Jazz", "Hip-Hop"],
    instruments: ["Trompette", "Saxophone", "Batterie", "Basse"],
    cover: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=600&h=600&fit=crop&q=80",
    venues: [1],
    links: [],
  },
  {
    email: "contact@cafenoirquartet.demo.giglink.app",
    isGroup: true,
    displayName: "Café Noir Quartet",
    bio: "Quartet jazz feutré (piano, contrebasse, batterie, voix). Standards et bossa pour cocktails, hôtels et dîners raffinés.",
    city: "Marseille",
    mobilityRadiusKm: 90,
    rateMin: 500,
    rateMax: 900,
    styles: ["Jazz", "Blues", "Variété"],
    instruments: ["Piano / Clavier", "Chant", "Basse", "Batterie"],
    cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=600&fit=crop&q=80",
    venues: [2, 0],
    links: [{ type: "EXTERNAL_LINK", provider: "YOUTUBE", url: "https://youtube.com/@demo-cafenoir" }],
  },
  {
    email: "booking@soundsystem92.demo.giglink.app",
    isGroup: true,
    displayName: "Sound System 92",
    bio: "Collectif reggae / hip-hop, MC + section rythmique + sono. Sets festifs pour soirées, plages et festivals urbains.",
    city: "Nantes",
    mobilityRadiusKm: 180,
    rateMin: 550,
    rateMax: 1000,
    styles: ["Reggae", "Hip-Hop", "Funk / Soul"],
    instruments: ["Chant", "Basse", "Batterie", "Percussions"],
    cover: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&h=600&fit=crop&q=80",
    venues: [4],
    links: [],
  },
  {
    email: "contact@electromirage.demo.giglink.app",
    isGroup: true,
    displayName: "Électro Mirage",
    bio: "Duo électro-pop live : chant, machines et batterie électronique. Ambiance club pour lancements de marque et afterworks.",
    city: "Toulouse",
    mobilityRadiusKm: 160,
    rateMin: 600,
    rateMax: 1100,
    styles: ["Électro", "Pop"],
    instruments: ["Chant", "Piano / Clavier", "Batterie"],
    cover: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&h=600&fit=crop&q=80",
    venues: [3, 1],
    links: [],
  },
  {
    email: "contact@velvetcorner.demo.giglink.app",
    isGroup: true,
    displayName: "The Velvet Corner",
    bio: "Groupe rock-blues à 4. Reprises et compos, son chaleureux à la Stones. Parfait pour bars à concerts et soirées privées.",
    city: "Bordeaux",
    mobilityRadiusKm: 120,
    rateMin: 500,
    rateMax: 950,
    styles: ["Rock", "Blues"],
    instruments: ["Guitare", "Chant", "Basse", "Batterie"],
    cover: "https://images.unsplash.com/photo-1508973379184-7517410fb0bc?w=600&h=600&fit=crop&q=80",
    venues: [3],
    links: [],
  },
  {
    email: "contact@balpopulaire.demo.giglink.app",
    isGroup: true,
    displayName: "Bal Populaire",
    bio: "Orchestre de bal (accordéon, chant, guitare, cuivres). Guinguette, valse, chanson française et tubes variété pour faire danser tout le monde.",
    city: "Paris",
    mobilityRadiusKm: 250,
    rateMin: 450,
    rateMax: 800,
    styles: ["Chanson française", "Variété", "Latino"],
    instruments: ["Accordéon", "Chant", "Guitare", "Trompette"],
    cover: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&h=600&fit=crop&q=80",
    venues: [0, 4],
    links: [],
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const styleRecords = await Promise.all(
    STYLES.map((name) => prisma.musicalStyle.upsert({ where: { name }, update: {}, create: { name } }))
  );
  const instrumentRecords = await Promise.all(
    INSTRUMENTS.map((name) => prisma.instrument.upsert({ where: { name }, update: {}, create: { name } }))
  );
  const styleByName = Object.fromEntries(styleRecords.map((s) => [s.name, s]));
  const instrumentByName = Object.fromEntries(instrumentRecords.map((i) => [i.name, i]));

  const recruiterUsers = [];
  for (const recruiter of RECRUITERS) {
    const user = await prisma.user.upsert({
      where: { email: recruiter.email },
      update: {},
      create: { email: recruiter.email, passwordHash, role: "RECRUITER", emailVerifiedAt: new Date() },
    });

    let venue = await prisma.venue.findFirst({ where: { contactUserId: user.id } });
    if (!venue) {
      venue = await prisma.venue.create({
        data: { name: recruiter.venueName, city: recruiter.city, contactUserId: user.id },
      });
    }

    // Fiche publique du lieu (type VENUE) : pour que ses soirées remontent sur
    // sa page + notifient ses abonnés, et qu'il ait un vrai nom (pas l'email).
    await prisma.profile.upsert({
      where: { userId: user.id },
      update: { displayName: recruiter.venueName, city: recruiter.city, profileType: "VENUE", status: "PUBLISHED" },
      create: {
        userId: user.id,
        profileType: "VENUE",
        displayName: recruiter.venueName,
        city: recruiter.city,
        openingHours: "Mar–Dim · 18h–2h",
        bio: `${recruiter.venueName} — bar & scène live à ${recruiter.city}. Concerts, DJ sets et soirées toute la semaine.`,
        status: "PUBLISHED",
      },
    });

    recruiterUsers.push({ user, venue });
  }

  let reviewCursor = 0;

  for (const [index, musician] of MUSICIANS.entries()) {
    const user = await prisma.user.upsert({
      where: { email: musician.email },
      update: {},
      create: { email: musician.email, passwordHash, role: "MUSICIAN", emailVerifiedAt: new Date() },
    });

    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        displayName: musician.displayName,
        bio: musician.bio,
        city: musician.city,
        mobilityRadiusKm: musician.mobilityRadiusKm,
        rateMin: musician.rateMin,
        rateMax: musician.rateMax,
        isGroup: (musician as { isGroup?: boolean }).isGroup ?? false,
        status: "PUBLISHED",
      },
      create: {
        userId: user.id,
        profileType: "MUSICIAN",
        isGroup: (musician as { isGroup?: boolean }).isGroup ?? false,
        displayName: musician.displayName,
        bio: musician.bio,
        city: musician.city,
        mobilityRadiusKm: musician.mobilityRadiusKm,
        rateMin: musician.rateMin,
        rateMax: musician.rateMax,
        status: "PUBLISHED",
        musicianProfile: { create: {} },
      },
    });

    await prisma.musicianProfile.upsert({
      where: { profileId: profile.id },
      update: {},
      create: { profileId: profile.id },
    });

    await prisma.musicianStyle.deleteMany({ where: { musicianProfileId: profile.id } });
    await prisma.musicianStyle.createMany({
      data: musician.styles.map((name) => ({ musicianProfileId: profile.id, styleId: styleByName[name].id })),
    });

    await prisma.musicianInstrument.deleteMany({ where: { musicianProfileId: profile.id } });
    await prisma.musicianInstrument.createMany({
      data: musician.instruments.map((name) => ({
        musicianProfileId: profile.id,
        instrumentId: instrumentByName[name].id,
      })),
    });

    const existingCover = await prisma.mediaItem.findFirst({ where: { profileId: profile.id, isCover: true } });
    if (!existingCover) {
      await prisma.mediaItem.create({
        data: {
          profileId: profile.id,
          type: "PHOTO",
          provider: "OTHER",
          url: musician.cover,
          isCover: true,
          position: 0,
        },
      });
    }

    for (const [linkIndex, link] of musician.links.entries()) {
      const existingLink = await prisma.mediaItem.findFirst({ where: { profileId: profile.id, url: link.url } });
      if (!existingLink) {
        await prisma.mediaItem.create({
          data: {
            profileId: profile.id,
            type: link.type as "EXTERNAL_LINK",
            provider: link.provider as "SPOTIFY" | "YOUTUBE" | "SOUNDCLOUD" | "INSTAGRAM",
            url: link.url,
            isCover: false,
            position: linkIndex + 1,
          },
        });
      }
    }

    const existingConsent = await prisma.consent.findFirst({ where: { userId: user.id, type: "TERMS" } });
    if (!existingConsent) {
      await prisma.consent.create({ data: { userId: user.id, type: "TERMS", granted: true } });
    }

    for (const [certIndex, venueIndex] of musician.venues.entries()) {
      const recruiter = recruiterUsers[venueIndex];
      const existingCertification = await prisma.certification.findFirst({
        where: { profileId: profile.id, venueId: recruiter.venue.id },
      });
      if (existingCertification) continue;

      const daysAgo = 12 + index * 5 + certIndex * 23;
      const certification = await prisma.certification.create({
        data: {
          profileId: profile.id,
          venueId: recruiter.venue.id,
          claimedVenueName: recruiter.venue.name,
          inviteToken: crypto.randomBytes(16).toString("hex"),
          performanceDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * daysAgo),
          status: "CONFIRMED",
          confirmedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * (daysAgo - 1)),
          confirmedByUserId: recruiter.user.id,
        },
      });

      await prisma.review.create({
        data: {
          certificationId: certification.id,
          rating: 3 + ((index + certIndex) % 3),
          comment: REVIEW_COMMENTS[reviewCursor % REVIEW_COMMENTS.length],
        },
      });
      reviewCursor += 1;
    }
  }

  const DJS = [
    {
      email: "dj.nova@demo.giglink.app",
      displayName: "DJ Nova",
      bio: "DJ électro/house, résidences club et soirées privées haut de gamme. Sets progressifs, lecture de salle à l'écoute du public.",
      city: "Paris",
      mobilityRadiusKm: 80,
      rateMin: 300,
      rateMax: 700,
      styles: ["Électro", "Hip-Hop"],
      equipmentNotes: "2x CDJ-3000, table Pioneer DJM-900NXS2, éclairage LED sur demande.",
      cover: "https://i.pravatar.cc/500?img=68",
      venues: [0, 3],
    },
    {
      email: "dj.mika@demo.giglink.app",
      displayName: "DJ Mika",
      bio: "DJ généraliste mariages et événements d'entreprise, tous styles, ambiance garantie de l'apéritif à la soirée dansante.",
      city: "Lyon",
      mobilityRadiusKm: 100,
      rateMin: 250,
      rateMax: 550,
      styles: ["Pop", "Latino", "Variété"],
      equipmentNotes: "Sonorisation complète incluse, platines vinyle sur demande, machine à fumée.",
      cover: "https://i.pravatar.cc/500?img=33",
      venues: [1],
    },
  ];

  for (const dj of DJS) {
    const user = await prisma.user.upsert({
      where: { email: dj.email },
      update: {},
      create: { email: dj.email, passwordHash, role: "MUSICIAN", emailVerifiedAt: new Date() },
    });

    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        displayName: dj.displayName,
        bio: dj.bio,
        city: dj.city,
        mobilityRadiusKm: dj.mobilityRadiusKm,
        rateMin: dj.rateMin,
        rateMax: dj.rateMax,
        status: "PUBLISHED",
      },
      create: {
        userId: user.id,
        profileType: "DJ",
        displayName: dj.displayName,
        bio: dj.bio,
        city: dj.city,
        mobilityRadiusKm: dj.mobilityRadiusKm,
        rateMin: dj.rateMin,
        rateMax: dj.rateMax,
        status: "PUBLISHED",
        djProfile: { create: { equipmentNotes: dj.equipmentNotes } },
      },
    });

    await prisma.djProfile.upsert({
      where: { profileId: profile.id },
      update: { equipmentNotes: dj.equipmentNotes },
      create: { profileId: profile.id, equipmentNotes: dj.equipmentNotes },
    });

    await prisma.djStyle.deleteMany({ where: { djProfileId: profile.id } });
    await prisma.djStyle.createMany({
      data: dj.styles.map((name) => ({ djProfileId: profile.id, styleId: styleByName[name].id })),
    });

    const existingCover = await prisma.mediaItem.findFirst({
      where: { profileId: profile.id, isCover: true },
    });
    if (!existingCover) {
      await prisma.mediaItem.create({
        data: {
          profileId: profile.id,
          type: "PHOTO",
          provider: "OTHER",
          url: dj.cover,
          isCover: true,
          position: 0,
        },
      });
    }

    for (const venueIndex of dj.venues) {
      const recruiter = recruiterUsers[venueIndex];
      const existingCertification = await prisma.certification.findFirst({
        where: { profileId: profile.id, venueId: recruiter.venue.id },
      });
      if (existingCertification) continue;

      const daysAgo = 15 + venueIndex * 9;
      const certification = await prisma.certification.create({
        data: {
          profileId: profile.id,
          venueId: recruiter.venue.id,
          claimedVenueName: recruiter.venue.name,
          inviteToken: crypto.randomBytes(16).toString("hex"),
          performanceDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * daysAgo),
          status: "CONFIRMED",
          confirmedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * (daysAgo - 1)),
          confirmedByUserId: recruiter.user.id,
        },
      });

      await prisma.review.create({
        data: {
          certificationId: certification.id,
          rating: 4 + (venueIndex % 2),
          comment: REVIEW_COMMENTS[reviewCursor % REVIEW_COMMENTS.length],
        },
      });
      reviewCursor += 1;
    }
  }

  await prisma.user.upsert({
    where: { email: "admin@demo.giglink.app" },
    update: {},
    create: {
      email: "admin@demo.giglink.app",
      passwordHash,
      role: "ADMIN",
      emailVerifiedAt: new Date(),
    },
  });

  // --- Événements de démo (carte + agenda) ---
  const HOUR = 60 * 60 * 1000;
  // Événements d'artistes (kind ARTIST) : startOffset/endOffset en heures depuis maintenant
  // Horaires en heures depuis maintenant. Plusieurs événements « en ce moment »
  // (start négatif) avec de longs créneaux, pour une démo toujours vivante.
  const ARTIST_EVENTS = [
    { email: "clara.jazz@demo.giglink.app", lat: 48.8606, lng: 2.3376, note: "Set jazz devant le Louvre 🎷", start: -2, end: 8 },
    { email: "malik.guitare@demo.giglink.app", lat: 45.7597, lng: 4.8422, note: "Reprises acoustiques Presqu'île 🎸", start: -1, end: 7 },
    { email: "sofia.violon@demo.giglink.app", lat: 43.2951, lng: 5.3746, note: "Violon sur le Vieux-Port 🎻", start: -0.5, end: 9 },
    { email: "amelie.piano@demo.giglink.app", lat: 48.853, lng: 2.3499, note: "Piano voix, parvis Notre-Dame 🎹", start: 4, end: 11 },
    { email: "yanis.traore@demo.giglink.app", lat: 43.6045, lng: 1.4442, note: "Beatbox place du Capitole 🎤", start: 24, end: 27 },
    { email: "hugo.faure@demo.giglink.app", lat: 43.2965, lng: 5.3698, note: "Reggae terrasse, cours Julien 🌴", start: 26, end: 29 },
    { email: "dj.nova@demo.giglink.app", lat: 48.8566, lng: 2.3522, note: "DJ set électro au parc 🎧", start: -1, end: 10 },
    { email: "dj.mika@demo.giglink.app", lat: 45.7597, lng: 4.8422, note: "Warm-up house en terrasse 🎛️", start: -0.5, end: 8 },
  ];
  // Événements d'établissements (kind VENUE) : postés par des recruteurs
  const VENUE_EVENTS = [
    { email: "contact@le-petit-bistrot.demo.giglink.app", title: "Jam session ouverte", note: "Scène ouverte tous styles, entrée libre 🎶", lat: 48.8649, lng: 2.3417, start: -1, end: 9 },
    { email: "booking@salle-eclipse.demo.giglink.app", title: "Soirée Électro Éclipse", note: "3 DJ, jusqu'au bout de la nuit 🔊", lat: 45.764, lng: 4.8357, start: 25, end: 31 },
    { email: "contact@comptoir-du-sud.demo.giglink.app", title: "Apéro concert live", note: "Concert + tapas en terrasse ☀️", lat: 43.2965, lng: 5.37, start: -0.5, end: 10 },
  ];

  // Organisateurs de soirées (comptes ORGANIZER) + leurs soirées (kind ORGANIZER)
  const ORGANIZERS = [
    { email: "hello@labubble.demo.giglink.app", name: "La Bubble", city: "Paris", desc: "Collectif de soirées rooftop : house, cocktails et coucher de soleil sur les toits de Paris. On booke DJ et lives pour des événements chics et festifs.", title: "La Bubble — Rooftop Sunset", note: "Coucher de soleil, house & cocktails 🫧", lat: 48.8722, lng: 2.3489, start: -2, end: 11 },
    { email: "hello@soho.demo.giglink.app", name: "SOHO", city: "Paris", desc: "Organisateur de nuits techno pointues, 2 salles, line-ups internationaux. On cherche des artistes pour habiller nos soirées jusqu'à l'aube.", title: "SOHO Night — Techno Room", note: "Line-up techno, 2 salles, jusqu'à l'aube 🖤", lat: 48.8566, lng: 2.3701, start: 25, end: 32 },
    { email: "hello@neonclub.demo.giglink.app", name: "Néon Club", city: "Lyon", desc: "Soirées disco & funk à l'ancienne, boule à facettes obligatoire. On programme groupes live et DJ pour faire danser tout le monde.", title: "Néon — Disco Fever", note: "Boule à facettes, funk & disco ✨", lat: 45.7578, lng: 4.832, start: 27, end: 33 },
    { email: "hello@cargosessions.demo.giglink.app", name: "Cargo Sessions", city: "Bordeaux", desc: "Warehouse au bord de l'eau, afro house et sets prolongés. Toujours à la recherche d'artistes pour nos sessions au bord des quais.", title: "Cargo Sessions — Afro House", note: "Warehouse au bord de l'eau, afro house 🌍", lat: 44.8451, lng: -0.5586, start: -1, end: 14 },
  ];

  for (const o of ORGANIZERS) {
    const u = await prisma.user.upsert({
      where: { email: o.email },
      update: {},
      create: { email: o.email, passwordHash, role: "ORGANIZER", emailVerifiedAt: new Date() },
    });
    // Fiche organisateur : un profil PUBLISHED contactable, comme un artiste.
    await prisma.profile.upsert({
      where: { userId: u.id },
      update: { displayName: o.name, bio: o.desc, city: o.city, status: "PUBLISHED" },
      create: {
        userId: u.id,
        profileType: "ORGANIZER",
        displayName: o.name,
        bio: o.desc,
        city: o.city,
        status: "PUBLISHED",
      },
    });
  }

  // Festivals (comptes FESTIVAL) + leurs événements (kind FESTIVAL)
  const FESTIVALS = [
    { email: "hello@sunwave.demo.giglink.app", name: "Sunwave Festival", title: "Sunwave Festival — Jour 1", note: "3 scènes, camping, line-up international 🎪🌞", lat: 43.6108, lng: 3.8767, start: 30, end: 42 },
    { email: "hello@echofest.demo.giglink.app", name: "Echo Festival", title: "Echo Festival — Open Air", note: "Électro en plein air, food trucks 🌌", lat: 47.2184, lng: -1.5536, start: -4, end: 30 },
  ];
  for (const f of FESTIVALS) {
    const u = await prisma.user.upsert({
      where: { email: f.email },
      update: {},
      create: { email: f.email, passwordHash, role: "FESTIVAL", emailVerifiedAt: new Date() },
    });
    await prisma.profile.upsert({
      where: { userId: u.id },
      update: { displayName: f.name, profileType: "FESTIVAL", status: "PUBLISHED" },
      create: { userId: u.id, profileType: "FESTIVAL", displayName: f.name, status: "PUBLISHED" },
    });
  }

  await prisma.event.deleteMany({}); // reset des événements de démo à chaque seed
  let eventCount = 0;
  for (const e of ARTIST_EVENTS) {
    const u = await prisma.user.findUnique({ where: { email: e.email }, include: { profile: true } });
    if (!u?.profile) continue;
    await prisma.event.create({
      data: {
        ownerUserId: u.id,
        profileId: u.profile.id,
        kind: "ARTIST",
        title: u.profile.displayName,
        note: e.note,
        lat: e.lat,
        lng: e.lng,
        startsAt: new Date(Date.now() + e.start * HOUR),
        endsAt: new Date(Date.now() + e.end * HOUR),
      },
    });
    eventCount += 1;
  }
  for (const e of VENUE_EVENTS) {
    const u = await prisma.user.findUnique({ where: { email: e.email }, include: { profile: true } });
    if (!u) continue;
    await prisma.event.create({
      data: {
        ownerUserId: u.id,
        profileId: u.profile?.id ?? null,
        kind: "VENUE",
        title: e.title,
        note: e.note,
        lat: e.lat,
        lng: e.lng,
        startsAt: new Date(Date.now() + e.start * HOUR),
        endsAt: new Date(Date.now() + e.end * HOUR),
      },
    });
    eventCount += 1;
  }
  for (const o of ORGANIZERS) {
    const u = await prisma.user.findUnique({ where: { email: o.email }, include: { profile: true } });
    if (!u) continue;
    await prisma.event.create({
      data: {
        ownerUserId: u.id,
        profileId: u.profile?.id ?? null,
        kind: "ORGANIZER",
        title: o.title,
        note: o.note,
        lat: o.lat,
        lng: o.lng,
        startsAt: new Date(Date.now() + o.start * HOUR),
        endsAt: new Date(Date.now() + o.end * HOUR),
      },
    });
    eventCount += 1;
  }

  for (const f of FESTIVALS) {
    const u = await prisma.user.findUnique({ where: { email: f.email }, include: { profile: true } });
    if (!u) continue;
    await prisma.event.create({
      data: {
        ownerUserId: u.id,
        profileId: u.profile?.id ?? null,
        kind: "FESTIVAL",
        title: f.title,
        note: f.note,
        lat: f.lat,
        lng: f.lng,
        startsAt: new Date(Date.now() + f.start * HOUR),
        endsAt: new Date(Date.now() + f.end * HOUR),
      },
    });
    eventCount += 1;
  }

  console.log("Seed terminé.");
  console.log(`Mot de passe de tous les comptes de démo : ${DEMO_PASSWORD}`);
  console.log(`${MUSICIANS.length} musiciens, ${DJS.length} DJ, ${RECRUITERS.length} recruteurs/lieux, ${ORGANIZERS.length} organisateurs, ${FESTIVALS.length} festivals, 1 admin.`);
  console.log(`${eventCount} événements de démo (carte/agenda).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
