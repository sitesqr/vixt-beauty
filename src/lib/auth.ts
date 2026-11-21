import "server-only";
import { cookies } from "next/headers";
import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import type { UserRole } from "@prisma/client";

const COOKIE_NAME = "vixt_beauty_session";
const SESSION_DAYS = 7;

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-only-secret-change-me-please-1234567890"
);

export type SessionPayload = {
  userId: string;
  role: UserRole;
  companyId: string | null;
  name: string;
  email: string;
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function generateToken() {
  return randomBytes(32).toString("hex");
}

export async function createSession(user: {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  memberships?: { companyId: string }[];
}) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const companyId =
    user.role === "SUPER_ADMIN"
      ? null
      : (user.memberships?.[0]?.companyId ?? null);

  const payload: SessionPayload = {
    userId: user.id,
    role: user.role,
    companyId,
    name: user.name,
    email: user.email,
  };

  const jwt = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret);

  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(jwt),
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return { token, jwt, payload };
}

export async function destroySession() {
  const cookieStore = await cookies();
  const jwt = cookieStore.get(COOKIE_NAME)?.value;
  if (jwt) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(jwt) } });
    cookieStore.delete(COOKIE_NAME);
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const jwt = cookieStore.get(COOKIE_NAME)?.value;
  if (!jwt) return null;

  try {
    const { payload } = await jwtVerify(jwt, secret);
    const session = await prisma.session.findUnique({
      where: { tokenHash: hashToken(jwt) },
    });
    if (!session || session.expiresAt < new Date()) return null;

    // refresh companyId from DB in case memberships changed
    const membership = await prisma.membership.findFirst({
      where: { userId: payload.userId as string },
      select: { companyId: true },
    });

    return {
      userId: payload.userId as string,
      role: payload.role as UserRole,
      name: payload.name as string,
      email: payload.email as string,
      companyId: (payload.role as string) === "SUPER_ADMIN" ? null : (membership?.companyId ?? null),
    };
  } catch {
    return null;
  }
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) throw new AuthError("Não autenticado", 401);
  return session;
}

export async function requireRole(...roles: UserRole[]) {
  const session = await requireAuth();
  if (!roles.includes(session.role)) {
    throw new AuthError("Acesso negado", 403);
  }
  return session;
}

/** Returns the companyId for tenant-scoped queries, always from membership. */
export async function requireCompanyContext() {
  const session = await requireAuth();
  if (session.role === "SUPER_ADMIN") {
    // super admin must pass companyId explicitly — never default to one
    throw new AuthError("SUPER_ADMIN deve informar a empresa", 400);
  }
  if (!session.companyId) throw new AuthError("Sem empresa vinculada", 403);
  return { ...session, companyId: session.companyId };
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}
