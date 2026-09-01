# Déploiement — tests iPhone (TestFlight)

Objectif : des testeurs installent WAZAZOO sur leur iPhone et créent de vrais
comptes. Mode **bêta** : comptes auto-validés (pas d'email), `AUTH_AUTO_VERIFY=true`.

Trois briques : **(1) backend en ligne**, **(2) app pointée dessus**, **(3) build iOS + TestFlight**.

---

## ⏱️ Le point le plus long — à lancer EN PREMIER
**Compte Apple Developer** (99 $/an) sur https://developer.apple.com/programs/
— l'activation peut prendre 24-48 h. Sans lui, pas de TestFlight. **Crée-le maintenant.**

Comptes gratuits à créer aussi :
- **Expo** (https://expo.dev) — pour les builds EAS.
- **Hébergeur backend** : **Railway** (https://railway.app, recommandé) ou Render.

---

## Étape 1 — Backend en ligne (Railway)

1. Sur Railway : *New Project → Deploy from GitHub repo* (ou `railway init` en CLI
   depuis `server/`). **Root directory = `server`**.
2. Ajouter un service **PostgreSQL** (Railway → *New → Database → PostgreSQL*).
   Railway fournit `DATABASE_URL` automatiquement.
3. **Variables d'environnement** du service serveur :
   ```
   NODE_ENV=production
   PORT=4000
   DATABASE_URL=<fourni par Railway>
   JWT_ACCESS_SECRET=<chaîne aléatoire longue>
   JWT_REFRESH_SECRET=<autre chaîne aléatoire longue>
   AUTH_AUTO_VERIFY=true
   TRUST_PROXY=true
   CLIENT_URL=https://wazazoo.app   # placeholder, pas critique pour le test mobile
   MAIL_FROM=no-reply@wazazoo.app   # inutilisé tant que AUTH_AUTO_VERIFY=true
   ```
   (Générer un secret : `openssl rand -hex 32`.)
   *Photos (optionnel) : les variables `S3_*` ne sont pas requises pour le test ;
   sans elles, l'upload de photos est simplement indisponible.*
4. **Build & start** — un **`Dockerfile` est fourni dans `server/`** : Railway le
   détecte et construit tout seul (`npm ci` → `prisma generate` → `npm run build`).
   Au démarrage, il fait `prisma db push` (sync du schéma) puis lance l'API compilée.
   Rien à configurer côté commande.
5. **Seed** (une fois, après le 1er déploiement) — depuis Railway :
   ```
   railway run npx tsx prisma/seed.ts            # comptes + événements de démo
   railway run npx tsx prisma/seed-venues-osm.ts  # ~1340 vrais lieux (OSM)
   ```
   *(ou en local en exportant `DATABASE_URL=<url publique Railway>` avant ces commandes.)*
6. Récupérer l'**URL HTTPS publique** du service (ex. `https://waza-server.up.railway.app`).
   La tester : `https://…/api/events/active` doit répondre du JSON.

> ⚠️ iOS exige **HTTPS** — Railway/Render en fournissent un d'office. Ne pas utiliser d'URL http://.

---

## Étape 2 — Pointer l'app vers le backend

Dans `~/GigLinkMobile/app.json`, remplacer `extra.apiUrl` par l'URL HTTPS de Railway :
```json
"extra": { "apiUrl": "https://waza-server.up.railway.app" }
```
(En dev local, l'app détecte l'IP du Mac via Metro ; `extra.apiUrl` sert au build
distribué, qui n'a pas de Metro.)

---

## Étape 3 — Build iOS + TestFlight (EAS)

Depuis `~/GigLinkMobile` :
```bash
npm i -g eas-cli
eas login                 # compte Expo
eas init                  # crée le projet EAS (écrit extra.eas.projectId)
eas build --platform ios --profile production   # demande l'identifiant Apple Developer
eas submit --platform ios --latest              # envoie sur TestFlight
```
Puis sur **App Store Connect** (https://appstoreconnect.apple.com) → TestFlight :
- Ajouter les testeurs en **testeurs internes** (jusqu'à 100 ; disponible dès que le
  build est « traité », sans revue Apple).
  *Les testeurs **externes** nécessitent une revue Apple (~24 h) — éviter pour jeudi.*
- Les testeurs reçoivent une invitation, installent **TestFlight** puis l'app.

---

## ✅ Checklist jeudi
- [ ] Compte Apple Developer actif (à lancer J-2).
- [ ] Backend Railway en ligne, `/api/events/active` répond en HTTPS.
- [ ] `seed.ts` + `seed-venues-osm.ts` exécutés (contenu de démo + vrais lieux).
- [ ] `app.json` → `extra.apiUrl` = URL HTTPS Railway.
- [ ] `eas build` iOS OK → `eas submit` → build « traité » sur TestFlight.
- [ ] Testeurs internes ajoutés, invitations envoyées.

## 🔒 Avant l'ouverture au public (après les tests)
- Retirer `AUTH_AUTO_VERIFY` et configurer un vrai envoi d'emails (SMTP / Resend).
- Configurer le stockage des photos (`S3_*`).
- Repasser les secrets en valeurs dédiées production.
