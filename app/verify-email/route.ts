import { eq } from "drizzle-orm";
import { getDb } from "../../db";
import { users } from "../../db/schema";
import { consumeAuthToken } from "../../lib/auth";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return Response.redirect(new URL("/login?verified=invalid", request.url));
  const record = await consumeAuthToken(token, "verify_email");
  if (!record) return Response.redirect(new URL("/login?verified=invalid", request.url));
  await getDb().update(users).set({ emailVerifiedAt: new Date(), updatedAt: new Date() }).where(eq(users.id, record.userId));
  return Response.redirect(new URL("/login?verified=1", request.url));
}
