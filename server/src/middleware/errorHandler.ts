import type { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { AppError } from "../lib/errors.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.code, message: err.message });
  }

  if (err instanceof MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE" ? "Fichier trop volumineux (8 Mo max)." : err.message;
    return res.status(400).json({ error: "upload_error", message });
  }

  const shaped = err as { statusCode?: number; code?: string; message?: string };
  if (shaped?.statusCode && shaped?.code) {
    return res.status(shaped.statusCode).json({ error: shaped.code, message: shaped.message });
  }

  console.error(err);
  res.status(500).json({ error: "internal_error", message: "Une erreur est survenue." });
}
