import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { getDb } from "../../db";
import { products } from "../../db/schema";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const rows = await getDb().select().from(products).where(eq(products.status, "active")).orderBy(asc(products.name));
  return <main className="catalog-page shell"><header className="catalog-header"><div><p className="section-index">PRODUCTS / GOFRIENDS</p><h1>产品与授权</h1><p>查看产品详情、版本记录并获得官方安装包。</p></div><Link className="button button-ghost" href="/">返回官网</Link></header><section className="catalog-grid">{rows.map((product) => <Link className="catalog-card" href={`/products/${product.slug}`} key={product.id}><span className="section-index">{product.isFree ? "FREE" : "SUBSCRIPTION"}</span><h2>{product.name}</h2><p>{product.description}</p><strong>{product.isFree ? "免费下载" : `¥${(product.priceCents / 100).toFixed(2)} / ${product.subscriptionMonths}个月`}</strong><span>查看详情 →</span></Link>)}</section></main>;
}
