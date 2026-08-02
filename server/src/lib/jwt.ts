import jwt from "jsonwebtoken";

export type AccessTokenPayload = {
  sub: string;
  role: "MUSICIAN" | "RECRUITER" | "ADMIN" | "TOURIST" | "ORGANIZER" | "FESTIVAL";
};

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "7d";

export function signAccessToken(payload: AccessTokenPayload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: ACCESS_TOKEN_TTL,
  });
}

export function signRefreshToken(payload: { sub: string }) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: REFRESH_TOKEN_TTL,
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as AccessTokenPayload & {
    iat: number;
    exp: number;
  };
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as {
    sub: string;
    iat: number;
    exp: number;
  };
}
