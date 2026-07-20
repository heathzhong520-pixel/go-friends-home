import { getUserFromRequest } from "../../../../lib/auth";
import { errorResponse, json } from "../../../../lib/http";

export async function GET(request: Request) {
  try { return json({ user: await getUserFromRequest(request) }); }
  catch (error) { return errorResponse(error, request); }
}
