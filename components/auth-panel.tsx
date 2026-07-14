"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type Mode = "login" | "register" | "forgot" | "reset";

const copy = {
  login: { title: "欢迎回来", submit: "登录", endpoint: "/api/auth/login" },
  register: { title: "创建账号", submit: "注册", endpoint: "/api/auth/register" },
  forgot: { title: "找回密码", submit: "发送重置邮件", endpoint: "/api/auth/forgot-password" },
  reset: { title: "设置新密码", submit: "更新密码", endpoint: "/api/auth/reset-password" },
} as const;

export function AuthPanel({ mode }: { mode: Mode }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = Object.fromEntries(form.entries());
    if (mode === "register") payload.acceptPolicies = form.get("acceptPolicies") === "on";
    if (mode === "reset") payload.token = new URLSearchParams(window.location.search).get("token") ?? "";

    try {
      const response = await fetch(copy[mode].endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json() as { error?: string; message?: string; verificationUrl?: string; resetUrl?: string };
      if (!response.ok) throw new Error(result.error ?? "请求失败");
      setIsError(false);
      setMessage(result.message ?? "操作成功");
      if (mode === "login") window.location.assign("/account");
      if (mode === "reset") setTimeout(() => window.location.assign("/login?reset=1"), 900);
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "请求失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <Link className="auth-brand" href="/"><span className="brand-mark" aria-hidden="true" /><span>GoFriends</span></Link>
      <section className="auth-card">
        <p className="section-index">ACCOUNT / GOFRIENDS</p>
        <h1>{copy[mode].title}</h1>
        <form onSubmit={submit}>
          {mode === "register" && <label>称呼<input name="name" autoComplete="name" minLength={2} maxLength={100} required /></label>}
          {mode !== "reset" && <label>邮箱<input name="email" type="email" autoComplete="email" required /></label>}
          {(mode === "login" || mode === "register" || mode === "reset") && <label>{mode === "reset" ? "新密码" : "密码"}<input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "login" ? 1 : 10} required /></label>}
          {mode === "register" && <label className="policy-check"><input name="acceptPolicies" type="checkbox" required /><span>我已阅读并同意 <Link href="/legal/terms">用户协议</Link>、<Link href="/legal/privacy">隐私政策</Link>和<Link href="/legal/refund">退款政策</Link></span></label>}
          <button className="button auth-submit" type="submit" disabled={busy}>{busy ? "处理中…" : copy[mode].submit}<span>→</span></button>
        </form>
        {message && <p className={isError ? "form-message error" : "form-message"}>{message}</p>}
        <div className="auth-links">
          {mode === "login" && <><Link href="/forgot-password">忘记密码？</Link><Link href="/register">创建账号</Link></>}
          {mode === "register" && <Link href="/login">已有账号，直接登录</Link>}
          {(mode === "forgot" || mode === "reset") && <Link href="/login">返回登录</Link>}
        </div>
      </section>
    </main>
  );
}
