import { Router } from "express";
import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";
import { requireAuth } from "../../../middleware/auth.js";
import { uploadRateLimit } from "../../../middleware/rateLimit.js";
import { AppError } from "../../../lib/errors.js";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

// L'extension écrite sur disque est TOUJOURS déduite du type MIME validé,
// jamais du nom de fichier envoyé par le client (empêche de stocker un .html).
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = EXT_BY_MIME[file.mimetype] ?? ".bin";
    cb(null, `${crypto.randomBytes(16).toString("hex")}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!EXT_BY_MIME[file.mimetype]) {
      cb(new AppError(400, "invalid_file_type", "Formats acceptés : JPEG, PNG, WEBP, GIF."));
      return;
    }
    cb(null, true);
  },
});

export const uploadRouter = Router();

uploadRouter.post(
  "/me/upload",
  requireAuth,
  uploadRateLimit,
  (req, _res, next) => {
    if (req.userRole !== "MUSICIAN") {
      next(new AppError(403, "forbidden", "Réservé aux profils artistes."));
      return;
    }
    next();
  },
  upload.single("file"),
  (req, res) => {
    if (!req.file) {
      throw new AppError(400, "no_file", "Aucun fichier reçu.");
    }
    res.status(201).json({ url: `/uploads/${req.file.filename}` });
  }
);
