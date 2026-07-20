import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../../../../db";
import { users } from "../../../../db/schema";
import { issueAuthToken } from "../../../../lib/auth";
import { errorResponse, json, readJson } from "../../../../lib/http";
import { absoluteUrl, sendMail } from "../../../../lib/mail";
import { assertSameOrigin } from "../../../../lib/security";
import { getDictionary, getRequestLocale } from "../../../../lib/i18n";

export async function POST(request: Request) {
  const locale = getRequestLocale(request);
  const copy = getDictionary(locale);
  try {
    assertSameOrigin(request);
    const { email } = z.object({ email: z.string().email().transform((value) => value.toLowerCase()) }).parse(await readJson(request));
    const [user] = await getDb().select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    let resetUrl: string | undefined;
    if (user) {
      const token = await issueAuthToken(user.id, "reset_password", 30);
      resetUrl = absoluteUrl(`/reset-password?token=${encodeURIComponent(token)}`);
      await sendMail({ to: email, subject: locale === "en" ? "Reset your GoFriends password" : "重置 GoFriends 密码", text: locale === "en" ? `Open this link within 30 minutes: ${resetUrl}` : `请在 30 分钟内打开：${resetUrl}`, html: locale === "en" ? `<p><a href="${resetUrl}">Reset password</a></p><p>This link is valid for 30 minutes.</p>` : `<p><a href="${resetUrl}">重置密码</a></p><p>链接 30 分钟内有效。</p>` });
    }
    const exposeResetUrl = process.env.NODE_ENV !== "production" || process.env.AUTH_TEST_MODE === "true";
    return json({ ok: true, message: copy.errors.resetSent, ...(exposeResetUrl && resetUrl ? { resetUrl } : {}) });
  } catch (error) { return errorResponse(error, request); }
}
