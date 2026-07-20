"use client";

import { useLocale } from "../components/locale-provider";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { dictionary } = useLocale();
  return <main className="error-page"><p className="section-index">SYSTEM ERROR</p><h1>{dictionary.errorPage.title}</h1><p>{dictionary.errorPage.body}</p><button className="button" type="button" onClick={reset}>{dictionary.common.retry} <span>↻</span></button></main>;
}
