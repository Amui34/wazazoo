# Backend WAZAZOO — image de production portable (Railway / Render / Fly.io).
# Une seule étape : on garde toutes les deps (dont tsx + prisma CLI) pour pouvoir
# lancer les seeds en prod via `railway run npx tsx prisma/seed.ts`.
FROM node:20-slim
WORKDIR /app
# OpenSSL requis par Prisma sur l'image slim.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build
# L'hébergeur fournit $PORT ; le serveur lit process.env.PORT.
EXPOSE 4000
# Synchronise le schéma (db push, additif) puis démarre l'API compilée.
CMD ["sh", "-c", "npx prisma db push && node dist/server.js"]
