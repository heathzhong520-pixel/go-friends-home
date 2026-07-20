"use client";

import { FormEvent, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { LanguageSwitcher } from "./language-switcher";
import { useLocale } from "./locale-provider";

type Mode = "login" | "register" | "forgot" | "reset";

const endpoints = {
  login: "/api/auth/login",
  register: "/api/auth/register",
  forgot: "/api/auth/forgot-password",
  reset: "/api/auth/reset-password",
} as const;

const subscribe = () => () => {};

export function AuthPanel({ mode }: { mode: Mode }) {
  const { locale, dictionary } = useLocale();
  const copy = dictionary.auth;
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
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
      const response = await fetch(endpoints[mode], { method: "POST", headers: { "content-type": "application/json", "x-gofriends-locale": locale }, body: JSON.stringify(payload) });
      const result = await response.json() as { error?: string; message?: string; verificationUrl?: string; resetUrl?: string };
      if (!response.ok) throw new Error(result.error ?? copy.requestFailed);
      setIsError(false);
      setMessage(result.message ?? copy.success);
      if (mode === "login") {
        const requested = new URLSearchParams(window.location.search).get("returnTo");
        window.location.assign(requested?.startsWith("/") && !requested.startsWith("//") ? requested : "/account");
      }
      if (mode === "reset") setTimeout(() => window.location.assign("/login?reset=1"), 900);
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : copy.requestFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <Link className="auth-brand" href="/"><span className="brand-mark" aria-hidden="true" /><span>GoFriends</span></Link>
      <section className="auth-card">
        <LanguageSwitcher className="language auth-language" />
        <p className="section-index">{copy.eyebrow}</p>
        <h1>{copy.modes[mode].title}</h1>
        <form onSubmit={submit}>
          {mode === "register" && <label>{copy.name}<input name="name" autoComplete="name" minLength={2} maxLength={100} required /></label>}
          {mode !== "reset" && <label>{copy.email}<input name="email" type="email" autoComplete="email" required /></label>}
          {(mode === "login" || mode === "register" || mode === "reset") && <label>{mode === "reset" ? copy.newPassword : copy.password}<input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "login" ? 1 : 10} required /></label>}
          {mode === "register" && <label className="policy-check"><input name="acceptPolicies" type="checkbox" required /><span>{copy.acceptPrefix} <Link href="/legal/terms">{copy.terms}</Link>, <Link href="/legal/privacy">{copy.privacy}</Link> &amp; <Link href="/legal/refund">{copy.refund}</Link></span></label>}
          <button className="button auth-submit" type="submit" disabled={busy || !hydrated}>{busy ? dictionary.common.loading : copy.modes[mode].submit}<span>→</span></button>
        </form>
        {message && <p className={isError ? "form-message error" : "form-message"}>{message}</p>}
        <div className="auth-links">
          {mode === "login" && <><Link href="/forgot-password">{copy.forgotPassword}</Link><Link href="/register">{copy.createAccount}</Link></>}
          {mode === "register" && <Link href="/login">{copy.haveAccount}</Link>}
          {(mode === "forgot" || mode === "reset") && <Link href="/login">{copy.backLogin}</Link>}
        </div>
      </section>
    </main>
  );
}
