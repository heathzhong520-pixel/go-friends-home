import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "../../../db";
import { products, productVersions } from "../../../db/schema";
import { CheckoutButton } from "../../../components/checkout-button";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = getDb();
  const [product] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  if (!product || product.status !== "active") notFound();
  const versions = await db.select().from(productVersions).where(eq(productVersions.productId, product.id)).orderBy(desc(productVersions.publishedAt));
  return <main className="product-page shell">
    <header className="product-hero"><div><Link className="inline-link" href="/products">← 全部产品</Link><p className="section-index">PRODUCT / {product.slug.toUpperCase()}</p><h1>{product.name}</h1><p>{product.description}</p></div><aside><p>{product.isFree ? "免费产品" : `${product.subscriptionMonths} 个月订阅`}</p><strong>{product.isFree ? "¥0" : `¥${(product.priceCents / 100).toFixed(2)}`}</strong>{!product.isFree && <CheckoutButton productId={product.id} priceCents={product.priceCents} testEnabled={process.env.PAYMENT_TEST_MODE === "true"} />}</aside></header>
    <section className="versions-section"><div><p className="section-index">VERSIONS</p><h2>版本与下载</h2></div><div className="version-list">{versions.length ? versions.map((version) => <article key={version.id}><div><strong>{version.version}</strong><span>{version.platform} · {version.publishedAt.toLocaleDateString("zh-CN")}</span></div><p>{version.changelog}</p>{version.ossObjectKey ? <a className="button button-ghost" href={`/api/downloads/${version.id}`}>下载 <span>↓</span></a> : <span className="download-pending">安装包待上传</span>}</article>) : <p className="empty-state">暂无公开版本</p>}</div></section>
  </main>;
}
