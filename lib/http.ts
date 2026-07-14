import { ZodError } from "zod";
import * as Sentry from "@sentry/node";
import { AuthError } from "./auth";

if (process.env.SENTRY_DSN && !Sentry.isInitialized()) {
  Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV, tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1) });
}

export function json(data: unknown, init: ResponseInit = {}) {
  return Response.json(data, {
    ...init,
    headers: { "cache-control": "no-store", ...init.headers },
  });
}

export function errorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return json({ error: "输入内容不符合要求", fields: error.flatten().fieldErrors }, { status: 400 });
  }
  if (error instanceof Error && error.message === "Invalid request origin") {
    return json({ error: "请求来源无效" }, { status: 403 });
  }
  if (error instanceof AuthError) {
    const messages = {
      UNAUTHORIZED: "请先登录",
      EMAIL_EXISTS: "该邮箱已经注册",
      INVALID_CREDENTIALS: "邮箱或密码不正确",
      ACCOUNT_LOCKED: "登录失败次数过多，请稍后再试",
      EMAIL_UNVERIFIED: "请先完成邮箱验证",
    };
    return json({ error: messages[error.code], code: error.code }, { status: error.code === "UNAUTHORIZED" ? 401 : 400 });
  }
  Sentry.captureException(error);
  console.error(error);
  return json({ error: "服务暂时不可用，请稍后重试" }, { status: 500 });
}

export async function readJson(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) throw new Error("Expected JSON request");
  return request.json();
}
