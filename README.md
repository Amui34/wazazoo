# GigLink

Plateforme de mise en relation entre musiciens indépendants et lieux qui les
embauchent (restaurants, bars, salles de concert, organisateurs
d'événements). MVP centré sur les musiciens ; modèle de données pensé pour
accueillir DJ / danseurs / techniciens lumière en V2 sans refonte.

Voir [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) pour le détail de
l'architecture de dossiers et du schéma de base de données.

## Stack

- **Frontend** : React + TypeScript + Vite + Tailwind CSS + React Query + React Router
- **Backend** : Node.js + Express + TypeScript + Prisma ORM
- **Base de données** : PostgreSQL
- **Stockage médias** : S3-compatible

## Démarrage

Prérequis : Node.js 20+, PostgreSQL, npm.

```bash
# 1. Backend
cd server
cp .env.example .env       # renseigner DATABASE_URL, JWT_*, etc.
npm install
npx prisma migrate dev     # crée les tables
npm run dev                # http://localhost:4000

# 2. Frontend (dans un autre terminal)
cd client
cp .env.example .env
npm install
npm run dev                # http://localhost:5173
```

## Structure

```
giglink/
├── client/     # app React (Vite + Tailwind)
├── server/     # API Express + Prisma
├── shared/     # types TS partagés client/serveur
└── docs/       # documentation d'architecture
```
