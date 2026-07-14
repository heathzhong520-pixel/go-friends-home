import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../../../../db";
import { users } from "../../../../db/schema";
import { AuthError, createSession, sessionCookie } from "../../../../lib/auth";
import { errorResponse, json, readJson } from "../../../../lib/http";
import { assertSameOrigin, verifyPassword } from "../../../../lib/security";

const schema = z.object({ email: z.string().trim().email().transform((value) => value.toLowerCase()), password: z.string().min(1).max(128) });

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const input = schema.parse(await readJson(request));
    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      if (user) {
        const attempts = user.failedLoginAttempts + 1;
        await db.update(users).set({ failedLoginAttempts: attempts, lockedUntil: attempts >= 5 ? new Date(Date.now() + 15 * 60_000) : null, updatedAt: new Date() }).where(eq(users.id, user.id));
      }
      throw new AuthError("INVALID_CREDENTIALS");
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) throw new AuthError("ACCOUNT_LOCKED");
    if (!user.emailVerifiedAt) throw new AuthError("EMAIL_UNVERIFIED");

    await db.update(users).set({ failedLoginAttempts: 0, lockedUntil: null, updatedAt: new Date() }).where(eq(users.id, user.id));
    const session = await createSession(user.id, request);
    return json({ ok: true, user: { id: user.id, email: user.email, name: user.name } }, { headers: { "set-cookie": sessionCookie(session.token) } });
  } catch (error) {
    return errorResponse(error);
  }
}
