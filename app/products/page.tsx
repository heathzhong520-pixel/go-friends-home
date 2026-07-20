import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { LanguageSwitcher } from "../../components/language-switcher";
import { getDb } from "../../db";
import { products } from "../../db/schema";
import { getDictionary } from "../../lib/i18n";
import { getServerLocale } from "../../lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const locale = await getServerLocale();
  const dictionary = getDictionary(locale);
  const copy = dictionary.products;
  const rows = await getDb().select().from(products).where(eq(products.status, "active")).orderBy(asc(products.name));
  return <main className="catalog-page shell"><header className="catalog-header"><div><p className="section-index">{copy.eyebrow}</p><h1>{copy.title}</h1><p>{copy.intro}</p></div><div className="page-actions"><LanguageSwitcher /><Link className="button button-ghost" href="/">{dictionary.common.backHome}</Link></div></header><section className="catalog-grid">{rows.map((product) => <Link className="catalog-card" href={`/products/${product.slug}`} key={product.id}><span className="section-index">{product.isFree ? copy.free : copy.subscription}</span><h2>{product.name}</h2><p>{locale === "en" ? product.descriptionEn ?? product.description : product.description}</p><strong>{product.isFree ? copy.freeDownload : `¥${(product.priceCents / 100).toFixed(2)} / ${product.subscriptionMonths} ${dictionary.common.months}`}</strong><span>{copy.viewDetails} →</span></Link>)}</section></main>;
}
