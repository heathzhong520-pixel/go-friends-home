import { and, eq, gt, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb } from "../db";
import { authTokens, sessions, users } from "../db/schema";
import { hashedRequestIp, randomToken, sha256 } from "./security";

export const SESSION_COOKIE = "gofriends_session";
const SESSION_SECONDS = 60 * 60 * 24 * 30;

function cookieValue(cookieHeader: string | null, name: string) {
  return cookieHeader?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1) ?? null;
}

export function sessionCookie(token: string, maxAge = SESSION_SECONDS) {
  const secure = (process.env.APP_URL ?? "").startsWith("https://");
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
}

export function clearSessionCookie() {
  return sessionCookie("", 0);
}

export async function createSession(userId: string, request: Request) {
  const token = randomToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_SECONDS * 1000);
  await getDb().insert(sessions).values({
    id: crypto.randomUUID(),
    userId,
    tokenHash: sha256(token),
    ipHash: hashedRequestIp(request),
    userAgent: request.headers.get("user-agent")?.slice(0, 255),
    createdAt: now,
    expiresAt,
  });
  return { token, expiresAt };
}

export async function destroySession(request: Request) {
  const token = cookieValue(request.headers.get("cookie"), SESSION_COOKIE);
  if (token) await getDb().delete(sessions).where(eq(sessions.tokenHash, sha256(decodeURIComponent(token))));
}

export async function getUserFromCookieHeader(cookieHeader: string | null) {
  const raw = cookieValue(cookieHeader, SESSION_COOKIE);
  if (!raw) return null;
  const [row] = await getDb()
    .select({ id: users.id, email: users.email, name: users.name, emailVerifiedAt: users.emailVerifiedAt, status: users.status })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, sha256(decodeURIComponent(raw))), gt(sessions.expiresAt, new Date()), eq(users.status, "active")))
    .limit(1);
  return row ?? null;
}

export async function getUserFromRequest(request: Request) {
  return getUserFromCookieHeader(request.headers.get("cookie"));
}

export async function getCurrentUser() {
  const requestHeaders = await headers();
  return getUserFromCookieHeader(requestHeaders.get("cookie"));
}

export async function requireUserFromRequest(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) throw new AuthError("UNAUTHORIZED");
  return user;
}

export async function issueAuthToken(userId: string, kind: "verify_email" | "reset_password", lifetimeMinutes: number) {
  const raw = randomToken();
  const now = new Date();
  await getDb().insert(authTokens).values({
    id: crypto.randomUUID(),
    userId,
    kind,
    tokenHash: sha256(raw),
    createdAt: now,
    expiresAt: new Date(now.getTime() + lifetimeMinutes * 60_000),
  });
  return raw;
}

export async function consumeAuthToken(raw: string, kind: "verify_email" | "reset_password") {
  const db = getDb();
  const [token] = await db.select().from(authTokens).where(and(
    eq(authTokens.tokenHash, sha256(raw)),
    eq(authTokens.kind, kind),
    isNull(authTokens.usedAt),
    gt(authTokens.expiresAt, new Date()),
  )).limit(1);
  if (!token) return null;
  await db.update(authTokens).set({ usedAt: new Date() }).where(eq(authTokens.id, token.id));
  return token;
}

export class AuthError extends Error {
  constructor(public code: "UNAUTHORIZED" | "EMAIL_EXISTS" | "INVALID_CREDENTIALS" | "ACCOUNT_LOCKED" | "EMAIL_UNVERIFIED") {
    super(code);
  }
}
