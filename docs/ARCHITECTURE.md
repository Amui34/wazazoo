# Architecture

## Arborescence

```
giglink/
├── client/                          # React + Tailwind (Vite, SPA)
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── src/
│       ├── main.tsx                 # bootstrap (router, react-query)
│       ├── App.tsx                  # déclaration des routes
│       ├── pages/                   # une page = un écran (Landing, Search, ProfilePublic...)
│       ├── features/                # logique métier groupée par domaine
│       │   ├── auth/
│       │   ├── musician-profile/
│       │   ├── search/
│       │   ├── contact-requests/
│       │   ├── certifications/
│       │   └── dashboard/
│       ├── components/              # composants UI génériques réutilisables
│       ├── hooks/                   # hooks partagés (useAuth, useDebounce...)
│       ├── lib/                     # client HTTP (axios), config react-query
│       ├── routes/                  # guards (RequireAuth, RequireRole)
│       └── types/                   # types front spécifiques
│
├── server/                          # Node.js + Express + TypeScript
│   ├── prisma/
│   │   ├── schema.prisma            # schéma de base de données (source de vérité)
│   │   ├── migrations/              # générées par `prisma migrate dev`
│   │   └── seed.ts                  # données de démo (styles, instruments...)
│   └── src/
│       ├── server.ts                # point d'entrée (écoute le port)
│       ├── app.ts                   # config Express (middlewares, routers)
│       ├── config/                  # lecture des variables d'env, constantes
│       ├── middleware/              # auth (JWT), erreurs, upload
│       ├── lib/                     # client Prisma singleton, client S3, mailer
│       └── modules/                 # un dossier par domaine métier, chacun avec
│           │                        # ses propres routes / controller / service
│           ├── auth/                # inscription, connexion, vérif email
│           ├── users/
│           ├── profiles/
│           │   └── musician/        # tout ce qui est spécifique musicien
│           │       # (V2 : profiles/dj, profiles/dancer, profiles/lighting-tech)
│           ├── venues/
│           ├── certifications/      # création + confirmation par le lieu
│           ├── contact-requests/    # demande de contact + partage coordonnées
│           ├── reviews/
│           ├── media/               # upload / présignature S3
│           └── search/              # filtres recruteur
│
├── shared/types/                    # types TS partagés (payloads API, enums)
└── docs/                            # documentation (ce fichier)
```

**Pourquoi `features/` côté client et `modules/` côté serveur, et pas un
découpage par "type de fichier" (`controllers/`, `services/`, `hooks/` à
plat) ?** Parce que le produit va grandir par domaine métier (profils,
certifications, contact, recherche...), donc regrouper le code qui change
ensemble limite les allers-retours entre dossiers quand on ajoute un écran
ou une fonctionnalité.

**Pourquoi séparer `profiles/musician/` du reste plutôt que d'avoir un
`MusicianController` au même niveau que `VenueController` ?** Pour que
l'ajout d'un type de profil en V2 (DJ, danseur, technicien lumière) se
traduise par un nouveau sous-dossier `profiles/dj/`, sans toucher au code
générique de `profiles/` (recherche, media, disponibilités) ni aux modules
`venues/`, `certifications/`, `contact-requests/`, `reviews/` qui
raisonnent déjà en termes de "profil" générique, pas de "musicien".

## Schéma de base de données

Le choix structurant : au lieu d'un `MusicianProfile` qui porterait
directement tous les champs et toutes les relations (avis, certifications,
media, demandes de contact...), on introduit un modèle générique
**`Profile`** avec un discriminant `profileType`. `MusicianProfile` devient
une extension 1-1 de `Profile` qui ne porte que ce qui est spécifique au
musicien (styles, instruments). Tout le reste (`Venue`, `Certification`,
`Review`, `ContactRequest`, `MediaItem`, `Availability`) référence
`Profile`, jamais `MusicianProfile`.

Conséquence concrète : ajouter les DJ en V2, c'est ajouter `ProfileType.DJ`
+ une table `DjProfile` (ses propres champs spécifiques) — zéro migration
sur la recherche, les certifications, les avis ou la messagerie.

```
User ──1:1── Profile ──1:1── MusicianProfile ──n:n── MusicalStyle
  │             │                  └──n:n── Instrument
  │             ├──1:n── MediaItem (photo/vidéo/audio_link/external_link)
  │             ├──1:n── Availability
  │             ├──1:n── Certification ──n:1── Venue ──1:1── User (contact)
  │             │              └──1:1── Review
  │             └──1:n── ContactRequest ──1:n── ContactDisclosure
  ├──1:n── EmailVerificationToken
  ├──1:n── PasswordResetToken
  └──1:n── Consent (RGPD)
```

### Points d'attention RGPD / anti-abus modélisés dans le schéma

- **Téléphone jamais public** : `User.phone` n'est jamais exposé par
  l'API tant qu'il n'y a pas de `ContactRequest.status = ACCEPTED`. Chaque
  divulgation crée une ligne `ContactDisclosure` (traçabilité).
- **Consentement explicite** : table `Consent` (type, accordé/révoqué,
  horodatage, IP) plutôt qu'un simple booléen sur `User`, pour garder
  l'historique.
- **Anti-abus sur les certifications** : une `Certification` naît toujours
  `PENDING` avec un `inviteToken` unique généré par le musicien. Rien n'est
  affiché publiquement (badge, avis) tant qu'un utilisateur recruteur
  authentifié et lié au `Venue` correspondant n'a pas confirmé via ce
  token (`status = CONFIRMED`, `confirmedByUserId` renseigné). Le champ
  `claimedVenueName` permet d'afficher "en attente de confirmation par X"
  avant même que le lieu ait un compte.
- **Un avis par certification confirmée** : `Review.certificationId` est
  unique, donc impossible de noter sans prestation confirmée par le lieu.

Fichier source : [`server/prisma/schema.prisma`](../server/prisma/schema.prisma).

## Auth

JWT (access court + refresh) stockés en cookies `httpOnly` + `secure`,
signés côté serveur avec `bcrypt` pour les mots de passe. Deux parcours
d'inscription distincts (`musicien` / `recruteur`) qui créent le même
`User` avec un `role` différent ; seul le rôle `MUSICIAN` crée un `Profile`
à l'étape suivante (formulaire multi-étapes).

## Prochaines étapes

On avance écran par écran (voir le prompt initial pour l'ordre du MVP) :
1. Landing page
2. Inscription / connexion
3. Création de profil musicien (formulaire multi-étapes)
4. Page profil public musicien
5. Recherche + filtres recruteur
6. Demande de contact
7. Interface de certification par un lieu
8. Dashboard musicien
