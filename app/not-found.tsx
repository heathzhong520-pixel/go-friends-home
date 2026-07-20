import Link from "next/link";
import { getDictionary } from "../lib/i18n";
import { getServerLocale } from "../lib/i18n-server";

export default async function NotFoundPage() {
  const dictionary = getDictionary(await getServerLocale());
  return <main className="error-page"><p className="section-index">404 / NOT FOUND</p><h1>{dictionary.notFound}</h1><Link className="button" href="/">{dictionary.common.backToHome} <span>→</span></Link></main>;
}
