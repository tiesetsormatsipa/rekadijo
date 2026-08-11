import { SignJWT, jwtVerify } from "jose";
import type { GlobalRole } from "@prisma/client";

export const SESSION_COOKIE_NAME = "rekadijo_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;

export type SessionPayload = {
  userId: string;
  email: string;
  globalRole: GlobalRole;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set. Copy .env.example to .env and set a strong random value.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecret());
}

/** Verifies the session cookie value directly, including in Edge middleware. */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
