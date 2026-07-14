"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function AccountLinks() {
  const [user, setUser] = useState<{ name: string } | null>(null);
  useEffect(() => { fetch("/api/auth/me").then((response) => response.json()).then((data) => setUser(data.user ?? null)).catch(() => setUser(null)); }, []);

  if (!user) return <><Link className="nav-text-button" href="/login">登录</Link><Link className="button button-small" href="/register">注册</Link></>;
  return <><Link className="nav-text-button" href="/account">{user.name}</Link><button className="button button-small" type="button" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.assign("/"); }}>退出</button></>;
}
