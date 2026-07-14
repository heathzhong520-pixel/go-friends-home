import Link from "next/link";
import type { ReactNode } from "react";

export function LegalPage({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return <main className="legal-page shell"><header><Link className="inline-link" href="/">← 返回官网</Link><p className="section-index">{eyebrow}</p><h1>{title}</h1><p>生效日期：2026 年 7 月 14 日 · 版本：2026-07-14</p></header><article>{children}</article><footer><p>如有疑问，请联系 <a href="mailto:hello@gofriends.dev">hello@gofriends.dev</a></p></footer></main>;
}
