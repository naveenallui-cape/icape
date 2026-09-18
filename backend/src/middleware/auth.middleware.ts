import { Request, Response, NextFunction } from "express";
import { jwtVerify, SignJWT } from "jose";
import { env } from "../config/env";
import { AppError } from "../middleware/error.middleware";

export type AdminJwtPayload = {
  sub: string;
  email: string;
  name: string;
};

export type SchoolJwtPayload = {
  sub: string;
  email: string;
  name: string;
  role: "school";
};

const adminCookieName = "icape_admin_session";
const schoolCookieName = "icape_school_session";

/** School portal stays signed in until manual logout */
const SCHOOL_SESSION_TTL = "365d";
const SCHOOL_COOKIE_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

function getSecretKey() {
  if (!env.authSecret) {
    throw new AppError("AUTH_SECRET is not configured", 500);
  }
  return new TextEncoder().encode(env.authSecret);
}

export async function signAdminToken(payload: AdminJwtPayload) {
  return new SignJWT({ email: payload.email, name: payload.name, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

export async function signSchoolToken(payload: SchoolJwtPayload) {
  return new SignJWT({
    email: payload.email,
    name: payload.name,
    role: "school",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(SCHOOL_SESSION_TTL)
    .sign(getSecretKey());
}

export async function verifyAdminToken(token: string): Promise<AdminJwtPayload> {
  const { payload } = await jwtVerify(token, getSecretKey());
  if (!payload.sub || typeof payload.email !== "string") {
    throw new AppError("Invalid session", 401);
  }
  return {
    sub: payload.sub,
    email: payload.email,
    name: typeof payload.name === "string" ? payload.name : "Admin",
  };
}

export async function verifySchoolToken(
  token: string,
): Promise<SchoolJwtPayload> {
  const { payload } = await jwtVerify(token, getSecretKey());
  if (
    !payload.sub ||
    typeof payload.email !== "string" ||
    payload.role !== "school"
  ) {
    throw new AppError("Invalid school session", 401);
  }
  return {
    sub: payload.sub,
    email: payload.email,
    name: typeof payload.name === "string" ? payload.name : "School",
    role: "school",
  };
}

export function setAdminCookie(res: Response, token: string) {
  res.cookie(adminCookieName, token, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearAdminCookie(res: Response) {
  res.clearCookie(adminCookieName, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax",
    path: "/",
  });
}

export function setSchoolCookie(res: Response, token: string) {
  res.cookie(schoolCookieName, token, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax",
    maxAge: SCHOOL_COOKIE_MAX_AGE_MS,
    path: "/",
  });
}

export function clearSchoolCookie(res: Response) {
  res.clearCookie(schoolCookieName, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax",
    path: "/",
  });
}

export function getAdminTokenFromRequest(req: Request) {
  const cookie = req.cookies?.[adminCookieName];
  if (typeof cookie === "string" && cookie.length > 0) return cookie;
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return null;
}

export function getSchoolTokenFromRequest(req: Request) {
  const cookie = req.cookies?.[schoolCookieName];
  if (typeof cookie === "string" && cookie.length > 0) return cookie;
  const header = req.headers.authorization;
  if (header?.startsWith("SchoolBearer ")) return header.slice(13);
  return null;
}

export async function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const token = getAdminTokenFromRequest(req);
    if (!token) throw new AppError("Unauthorized", 401);
    const payload = await verifyAdminToken(token);
    (req as Request & { admin?: AdminJwtPayload }).admin = payload;
    next();
  } catch {
    next(new AppError("Unauthorized", 401));
  }
}

export async function requireSchool(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = getSchoolTokenFromRequest(req);
    if (!token) throw new AppError("Unauthorized", 401);
    const payload = await verifySchoolToken(token);
    (req as Request & { school?: SchoolJwtPayload }).school = payload;
    // Sliding session: keep school logged in until manual logout
    const refreshed = await signSchoolToken(payload);
    setSchoolCookie(res, refreshed);
    next();
  } catch {
    next(new AppError("Unauthorized", 401));
  }
}

export function getRequestAdmin(req: Request): AdminJwtPayload {
  const admin = (req as Request & { admin?: AdminJwtPayload }).admin;
  if (!admin) throw new AppError("Unauthorized", 401);
  return admin;
}

export function getRequestSchool(req: Request): SchoolJwtPayload {
  const school = (req as Request & { school?: SchoolJwtPayload }).school;
  if (!school) throw new AppError("Unauthorized", 401);
  return school;
}

export {
  adminCookieName as ADMIN_COOKIE_NAME,
  schoolCookieName as SCHOOL_COOKIE_NAME,
};
