import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../../../../db";
import { users } from "../../../../db/schema";
import { issueAuthToken } from "../../../../lib/auth";
import { errorResponse, json, readJson } from "../../../../lib/http";
import { absoluteUrl, sendMail } from "../../../../lib/mail";
import { assertSameOrigin } from "../../../../lib/security";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const { email } = z.object({ email: z.string().email().transform((value) => value.toLowerCase()) }).parse(await readJson(request));
    const [user] = await getDb().select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    let resetUrl: string | undefined;
    if (user) {
      const token = await issueAuthToken(user.id, "reset_password", 30);
      resetUrl = absoluteUrl(`/reset-password?token=${encodeURIComponent(token)}`);
      await sendMail({ to: email, subject: "重置 GoFriends 密码", text: `请在 30 分钟内打开：${resetUrl}`, html: `<p><a href="${resetUrl}">重置密码</a></p><p>链接 30 分钟内有效。</p>` });
    }
    return json({ ok: true, message: "如果邮箱已注册，我们会发送重置链接", ...(process.env.NODE_ENV !== "production" && resetUrl ? { resetUrl } : {}) });
  } catch (error) { return errorResponse(error); }
}
