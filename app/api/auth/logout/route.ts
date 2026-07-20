import { clearSessionCookie, destroySession } from "../../../../lib/auth";
import { errorResponse, json } from "../../../../lib/http";
import { assertSameOrigin } from "../../../../lib/security";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await destroySession(request);
    return json({ ok: true }, { headers: { "set-cookie": clearSessionCookie() } });
  } catch (error) { return errorResponse(error, request); }
}
