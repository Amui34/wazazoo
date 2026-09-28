# =============================================================================
# WAZAZOO — image web (front React servi en statique par Caddy, HTTP interne).
#   :80 → front React (client/) ; /api + /uploads proxifiés vers Railway.
# Le TLS est géré par le proxy partagé (amui-proxy), pas ici.
#
# L'URL d'API est laissée RELATIVE (pas de VITE_API_URL) : le client appelle
# /api/... sur wazazoo.pro, et le Caddy interne (docker/Caddyfile) reverse-proxy
# vers le backend Railway. Cookies d'auth first-party → connexion web OK.
# =============================================================================

# --- 1) Build du client React (Vite) ----------------------------------------
FROM node:22-alpine AS build
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# --- 2) Serveur statique ------------------------------------------------------
FROM caddy:2-alpine
COPY docker/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/client/dist /srv
EXPOSE 80
