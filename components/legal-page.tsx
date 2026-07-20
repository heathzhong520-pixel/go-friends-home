import Link from "next/link";
import { LanguageSwitcher } from "./language-switcher";
import { getDictionary } from "../lib/i18n";
import { getServerLocale } from "../lib/i18n-server";

export async function LegalPage({ kind }: { kind: "privacy" | "terms" | "refund" }) {
  const dictionary = getDictionary(await getServerLocale());
  const copy = dictionary.legal[kind];
  return <main className="legal-page shell"><header><div className="page-actions"><LanguageSwitcher /></div><Link className="inline-link" href="/">← {dictionary.common.backHome}</Link><p className="section-index">{copy.eyebrow}</p><h1>{copy.title}</h1><p>{dictionary.legal.effective}</p></header><article>{copy.sections.map(([title, body]) => <section key={title}><h2>{title}</h2><p>{body}</p></section>)}</article><footer><p>{dictionary.legal.contact} <a href="mailto:hello@gofriends.dev">hello@gofriends.dev</a></p></footer></main>;
}
