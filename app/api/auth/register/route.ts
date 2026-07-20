import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../../../../db";
import { legalAcceptances, users } from "../../../../db/schema";
import { AuthError, issueAuthToken } from "../../../../lib/auth";
import { errorResponse, json, readJson } from "../../../../lib/http";
import { absoluteUrl, sendMail } from "../../../../lib/mail";
import { assertSameOrigin, hashPassword, hashedRequestIp } from "../../../../lib/security";
import { getDictionary, getRequestLocale } from "../../../../lib/i18n";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(191).transform((value) => value.toLowerCase()),
  password: z.string().min(10).max(128),
  acceptPolicies: z.literal(true),
});

export async function POST(request: Request) {
  const locale = getRequestLocale(request);
  const copy = getDictionary(locale);
  try {
    assertSameOrigin(request);
    const input = schema.parse(await readJson(request));
    const db = getDb();
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1);
    if (existing) throw new AuthError("EMAIL_EXISTS");

    const now = new Date();
    const userId = crypto.randomUUID();
    await db.transaction(async (tx) => {
      await tx.insert(users).values({
        id: userId,
        email: input.email,
        name: input.name,
        passwordHash: await hashPassword(input.password),
        createdAt: now,
        updatedAt: now,
      });
      await tx.insert(legalAcceptances).values(["privacy", "terms", "refund"].map((document) => ({
        id: crypto.randomUUID(), userId, document: document as "privacy" | "terms" | "refund", version: "2026-07-14", acceptedAt: now, ipHash: hashedRequestIp(request),
      })));
    });

    const token = await issueAuthToken(userId, "verify_email", 24 * 60);
    const verificationUrl = absoluteUrl(`/verify-email?token=${encodeURIComponent(token)}`);
    await sendMail({
      to: input.email,
      subject: locale === "en" ? "Verify your GoFriends email" : "验证你的 GoFriends 邮箱",
      text: locale === "en" ? `Open this link within 24 hours to verify your email: ${verificationUrl}` : `请在 24 小时内打开此链接完成验证：${verificationUrl}`,
      html: locale === "en" ? `<p>Welcome to GoFriends.</p><p><a href="${verificationUrl}">Verify email</a></p><p>This link is valid for 24 hours.</p>` : `<p>欢迎加入 GoFriends。</p><p><a href="${verificationUrl}">验证邮箱</a></p><p>链接 24 小时内有效。</p>`,
    });
    const exposeVerificationUrl = process.env.NODE_ENV !== "production" || process.env.AUTH_TEST_MODE === "true";
    return json({ ok: true, message: copy.errors.registerSuccess, ...(exposeVerificationUrl ? { verificationUrl } : {}) }, { status: 201 });
  } catch (error) {
    return errorResponse(error, request);
  }
}
