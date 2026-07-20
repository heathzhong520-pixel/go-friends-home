import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../../../../db";
import { sessions, users } from "../../../../db/schema";
import { consumeAuthToken } from "../../../../lib/auth";
import { errorResponse, json, readJson } from "../../../../lib/http";
import { assertSameOrigin, hashPassword } from "../../../../lib/security";
import { getDictionary, getRequestLocale } from "../../../../lib/i18n";

export async function POST(request: Request) {
  const copy = getDictionary(getRequestLocale(request)).errors;
  try {
    assertSameOrigin(request);
    const input = z.object({ token: z.string().min(20), password: z.string().min(10).max(128) }).parse(await readJson(request));
    const token = await consumeAuthToken(input.token, "reset_password");
    if (!token) return json({ error: copy.invalidReset }, { status: 400 });
    const db = getDb();
    await db.transaction(async (tx) => {
      await tx.update(users).set({ passwordHash: await hashPassword(input.password), failedLoginAttempts: 0, lockedUntil: null, updatedAt: new Date() }).where(eq(users.id, token.userId));
      await tx.delete(sessions).where(eq(sessions.userId, token.userId));
    });
    return json({ ok: true, message: copy.passwordUpdated });
  } catch (error) { return errorResponse(error, request); }
}
