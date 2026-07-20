import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CheckoutButton } from "../../../components/checkout-button";
import { LanguageSwitcher } from "../../../components/language-switcher";
import { getDb } from "../../../db";
import { products, productVersions } from "../../../db/schema";
import { formatDate, getDictionary } from "../../../lib/i18n";
import { getServerLocale } from "../../../lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const locale = await getServerLocale();
  const dictionary = getDictionary(locale);
  const copy = dictionary.products;
  const { slug } = await params;
  const db = getDb();
  const [product] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  if (!product || product.status !== "active") notFound();
  const versions = await db.select().from(productVersions).where(eq(productVersions.productId, product.id)).orderBy(desc(productVersions.publishedAt));
  return <main className="product-page shell">
    <div className="page-actions product-page-actions"><LanguageSwitcher /></div>
    <header className="product-hero"><div><Link className="inline-link" href="/products">← {copy.allProducts}</Link><p className="section-index">PRODUCT / {product.slug.toUpperCase()}</p><h1>{product.name}</h1><p>{locale === "en" ? product.descriptionEn ?? product.description : product.description}</p></div><aside><p>{product.isFree ? copy.freeProduct : `${product.subscriptionMonths} ${copy.subscriptionPeriod}`}</p><strong>{product.isFree ? "¥0" : `¥${(product.priceCents / 100).toFixed(2)}`}</strong>{!product.isFree && <CheckoutButton productId={product.id} priceCents={product.priceCents} testEnabled={process.env.PAYMENT_TEST_MODE === "true"} />}</aside></header>
    <section className="versions-section"><div><p className="section-index">VERSIONS</p><h2>{copy.versions}</h2></div><div className="version-list">{versions.length ? versions.map((version) => <article key={version.id}><div><strong>{version.version}</strong><span>{version.platform} · {formatDate(version.publishedAt, locale)}</span></div><p>{locale === "en" ? version.changelogEn ?? version.changelog : version.changelog}</p>{version.ossObjectKey ? <a className="button button-ghost" href={`/api/downloads/${version.id}`}>{dictionary.common.download} <span>↓</span></a> : <span className="download-pending">{copy.packagePending}</span>}</article>) : <p className="empty-state">{copy.noVersions}</p>}</div></section>
  </main>;
}
