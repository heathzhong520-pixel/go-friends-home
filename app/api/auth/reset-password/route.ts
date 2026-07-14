import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../../../../db";
import { sessions, users } from "../../../../db/schema";
import { consumeAuthToken } from "../../../../lib/auth";
import { errorResponse, json, readJson } from "../../../../lib/http";
import { assertSameOrigin, hashPassword } from "../../../../lib/security";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const input = z.object({ token: z.string().min(20), password: z.string().min(10).max(128) }).parse(await readJson(request));
    const token = await consumeAuthToken(input.token, "reset_password");
    if (!token) return json({ error: "重置链接无效或已过期" }, { status: 400 });
    const db = getDb();
    await db.transaction(async (tx) => {
      await tx.update(users).set({ passwordHash: await hashPassword(input.password), failedLoginAttempts: 0, lockedUntil: null, updatedAt: new Date() }).where(eq(users.id, token.userId));
      await tx.delete(sessions).where(eq(sessions.userId, token.userId));
    });
    return json({ ok: true, message: "密码已经更新，请重新登录" });
  } catch (error) { return errorResponse(error); }
}
