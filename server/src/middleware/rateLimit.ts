import rateLimit from "express-rate-limit";

const message = {
  error: "too_many_requests",
  message: "Trop de tentatives, réessaie dans quelques minutes.",
};

// Login / signup / renvoi d'email : très strict.
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message,
});

// Endpoints consommant un token (vérification email, certification) :
// empêche la recherche de tokens par force brute.
export const tokenRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message,
});

// Créations qui peuvent servir au spam (demandes de contact...).
export const writeRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message,
});

// Uploads de fichiers : protège le disque.
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message,
});

// Filet de sécurité global sur toute l'API.
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message,
});
