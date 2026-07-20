import { ZodError } from "zod";
import * as Sentry from "@sentry/node";
import { AuthError } from "./auth";
import { getDictionary, getRequestLocale } from "./i18n";

if (process.env.SENTRY_DSN && !Sentry.isInitialized()) {
  Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV, tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1) });
}

export function json(data: unknown, init: ResponseInit = {}) {
  return Response.json(data, {
    ...init,
    headers: { "cache-control": "no-store", ...init.headers },
  });
}

export function errorResponse(error: unknown, request?: Request) {
  const copy = getDictionary(request ? getRequestLocale(request) : "zh").errors;
  if (error instanceof ZodError) {
    return json({ error: copy.invalidInput, fields: error.flatten().fieldErrors }, { status: 400 });
  }
  if (error instanceof Error && error.message === "Invalid request origin") {
    return json({ error: copy.invalidOrigin }, { status: 403 });
  }
  if (error instanceof AuthError) {
    const messages = {
      UNAUTHORIZED: copy.unauthorized,
      EMAIL_EXISTS: copy.emailExists,
      INVALID_CREDENTIALS: copy.invalidCredentials,
      ACCOUNT_LOCKED: copy.accountLocked,
      EMAIL_UNVERIFIED: copy.emailUnverified,
    };
    return json({ error: messages[error.code], code: error.code }, { status: error.code === "UNAUTHORIZED" ? 401 : 400 });
  }
  Sentry.captureException(error);
  console.error(error);
  return json({ error: copy.unavailable }, { status: 500 });
}

export async function readJson(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) throw new Error("Expected JSON request");
  return request.json();
}
