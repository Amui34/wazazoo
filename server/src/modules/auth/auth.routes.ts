import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { validateBody } from "../../middleware/validate.js";
import { requireAuth } from "../../middleware/auth.js";
import { authRateLimit, tokenRateLimit } from "../../middleware/rateLimit.js";
import {
  signupSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
} from "./auth.schema.js";
import * as authService from "./auth.service.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../lib/jwt.js";
import {
  setAuthCookies,
  setAccessCookie,
  clearAuthCookies,
  REFRESH_COOKIE,
} from "../../lib/authCookies.js";
import { AppError } from "../../lib/errors.js";

export const authRouter = Router();

authRouter.post(
  "/signup",
  authRateLimit,
  validateBody(signupSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.signup(req.body, req.ip);
    res.status(201).json(result);
  })
);

authRouter.post(
  "/verify-email",
  tokenRateLimit,
  validateBody(verifyEmailSchema),
  asyncHandler(async (req, res) => {
    await authService.verifyEmail(req.body.token);
    res.status(200).json({ verified: true });
  })
);

authRouter.post(
  "/resend-verification",
  authRateLimit,
  validateBody(resendVerificationSchema),
  asyncHandler(async (req, res) => {
    await authService.resendVerification(req.body.email);
    res.status(200).json({
      message: "Si un compte existe et n'est pas encore vérifié, un email vient d'être envoyé.",
    });
  })
);

authRouter.post(
  "/login",
  authRateLimit,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const user = await authService.validateCredentials(req.body);

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const refreshToken = signRefreshToken({ sub: user.id });

    const body: Record<string, unknown> = {
      user: { id: user.id, email: user.email, role: user.role },
    };

    // Clients mobiles : pas de cookie jar, on renvoie les jetons dans le corps
    // pour qu'ils les stockent en SecureStore. Le web garde les cookies httpOnly.
    if (req.headers["x-auth-mode"] === "token") {
      body.accessToken = accessToken;
      body.refreshToken = refreshToken;
    } else {
      setAuthCookies(res, accessToken, refreshToken);
    }

    res.status(200).json(body);
  })
);

authRouter.post("/logout", (_req, res) => {
  clearAuthCookies(res);
  res.status(204).send();
});

authRouter.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const tokenMode = req.headers["x-auth-mode"] === "token";
    const token = tokenMode
      ? req.body?.refreshToken ?? req.headers["x-refresh-token"]
      : req.cookies?.[REFRESH_COOKIE];
    if (!token || typeof token !== "string") {
      throw new AppError(401, "not_authenticated", "Session expirée.");
    }

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw new AppError(401, "not_authenticated", "Session expirée.");
    }

    const user = await authService.getUserById(payload.sub);
    if (!user) {
      throw new AppError(401, "not_authenticated", "Session expirée.");
    }

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const body: Record<string, unknown> = {
      user: { id: user.id, email: user.email, role: user.role },
    };
    if (tokenMode) {
      body.accessToken = accessToken;
    } else {
      setAccessCookie(res, accessToken);
    }
    res.status(200).json(body);
  })
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await authService.getUserById(req.userId!);
    if (!user) {
      throw new AppError(401, "not_authenticated", "Session expirée.");
    }
    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerified: Boolean(user.emailVerifiedAt),
      },
    });
  })
);

// Suppression définitive du compte (RGPD + exigence App Store). Efface toutes
// les données liées puis déconnecte (cookies effacés).
authRouter.delete(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    await authService.deleteAccount(req.userId!);
    clearAuthCookies(res);
    res.status(200).json({ deleted: true });
  })
);
